import cv2
import time
import numpy as np
import pandas as pd
from ultralytics import YOLO
import tensorflow as tf
import tensorflow_hub as hub
import mediapipe as mp
from collections import deque

# --- CONFIG ---
INPUT_VIDEO = 'scripts/vision-spike/input.mp4'
OUTPUT_VIDEO = 'scripts/vision-spike/comparison_output.mp4'
TARGET_SIZE = (480, 480) # Resize for detailed grid
STANDING_THRESHOLD = 0.50
SQUAT_THRESHOLD = 0.60

# --- UTILS ---
class RepCounter:
    def __init__(self):
        self.reps = 0
        self.state = 'STANDING'
        self.history = deque(maxlen=5) # Smoothing
        self.last_y = 0

    def update(self, hip_y):
        if hip_y is None or hip_y == 0: return self.reps, self.state
        
        self.history.append(hip_y)
        avg_y = sum(self.history) / len(self.history)
        self.last_y = avg_y

        if self.state == 'STANDING':
            if avg_y > SQUAT_THRESHOLD:
                self.state = 'BOTTOM'
        elif self.state == 'BOTTOM':
            if avg_y < STANDING_THRESHOLD:
                self.state = 'STANDING'
                self.reps += 1
        
        return self.reps, self.state

def draw_stats(image, model_name, inf_ms, fps, reps, state, hip_y):
    # Overlay semi-transparent box
    overlay = image.copy()
    cv2.rectangle(overlay, (0, 0), (220, 130), (0, 0, 0), -1)
    alpha = 0.6
    cv2.addWeighted(overlay, alpha, image, 1 - alpha, 0, image)

    color = (0, 255, 0) if state == 'STANDING' else (0, 0, 255)
    
    cv2.putText(image, f"{model_name}", (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    cv2.putText(image, f"Inf: {inf_ms:.1f}ms", (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)
    cv2.putText(image, f"FPS: {fps:.1f}", (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)
    cv2.putText(image, f"Reps: {reps}", (10, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 0), 2)
    cv2.putText(image, f"{state}", (100, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
    
    # Progress Bar for Depth
    bar_h = 10
    bar_w = 200
    bar_x, bar_y = 10, 115
    fill = max(0, min(1, (hip_y - 0.3) / (0.7 - 0.3))) # Approximate range
    cv2.rectangle(image, (bar_x, bar_y), (bar_x + bar_w, bar_y + bar_h), (50, 50, 50), -1)
    cv2.rectangle(image, (bar_x, bar_y), (bar_x + int(bar_w * fill), bar_y + bar_h), color, -1)

# --- MODELS ---

# --- UTILS ---
def get_primary_person(results):
    """
    Selects the 'primary' person explicitly based on heuristic score:
    Score = (Area * 0.7) + ((1 - DistToCenter) * 0.3)
    Assumes the user is the largest object and roughly centered.
    """
    if not results or len(results) == 0: return None, None

    best_idx = -1
    max_score = -1
    
    # Image dims (normalized 0-1)
    center_x, center_y = 0.5, 0.5
    
    boxes = results[0].boxes
    if boxes is None: return None, None

    for i, box in enumerate(boxes):
        # Box format: [x1, y1, x2, y2] (pixels) but we want ratio for heuristic or just raw pixels
        # Let's use normalized xywh if available or calc from pixel boxes
        b = box.xywhn.cpu().numpy()[0] # [x_center, y_center, w, h] normalized
        
        area = b[2] * b[3]
        dist = ((b[0] - center_x)**2 + (b[1] - center_y)**2)**0.5
        norm_dist = max(0, 1 - (dist * 2)) # 1 is at center, 0 is at edge

        score = (area * 0.7) + (norm_dist * 0.3)
        
        if score > max_score:
            max_score = score
            best_idx = i
            
    if best_idx != -1:
        return best_idx, max_score
    return None, None

class YOLOModel:
    def __init__(self, name):
        self.name = name
        self.model = YOLO(name)
        self.counter = RepCounter()

    def process(self, frame):
        start = time.time()
        results = self.model(frame, verbose=False)
        inf_ms = (time.time() - start) * 1000
        
        # Get annotated frame - we will manually draw ONLY the best person to clean up
        # annotated = results[0].plot() # This draws EVERYONE
        annotated = frame.copy()
        
        best_idx, score = get_primary_person(results)
        best_hip_y = 0
        state = self.counter.state

        if best_idx is not None:
            # Draw only the primary person
            # Reuse Ultralytics plotter but filtered? 
            # Or manually draw simple skeleton for clarity
            kps = results[0].keypoints.xy.cpu().numpy()[best_idx] # [17, 2] pixels
            
            # Draw Skeleton
            skeleton = [
                (5,6),(5,7),(7,9),(6,8),(8,10), # Arms
                (5,11),(6,12),(11,12), # Torso
                (11,13),(13,15),(12,14),(14,16) # Legs
            ]
            
            for p1, p2 in skeleton:
                if p1 < len(kps) and p2 < len(kps):
                    pt1 = (int(kps[p1][0]), int(kps[p1][1]))
                    pt2 = (int(kps[p2][0]), int(kps[p2][1]))
                    if pt1 != (0,0) and pt2 != (0,0):
                        cv2.line(annotated, pt1, pt2, (0, 255, 0), 2)
            
            for kp in kps:
                pt = (int(kp[0]), int(kp[1]))
                if pt != (0,0):
                    cv2.circle(annotated, pt, 4, (0, 255, 255), -1)

            # Get normalized Hip Y for counting
            # Need to re-normalize manually since .xy is pixels
            h, w, _ = frame.shape
            kps_n = results[0].keypoints.xyn.cpu().numpy()[best_idx]
            best_hip_y = kps_n[11][1]
            
            # Bounding Box for debug
            box = results[0].boxes.xyxy.cpu().numpy()[best_idx]
            cv2.rectangle(annotated, (int(box[0]), int(box[1])), (int(box[2]), int(box[3])), (255, 0, 0), 2)

        reps, state = self.counter.update(best_hip_y)
        draw_stats(annotated, self.name, inf_ms, 1000/inf_ms if inf_ms > 0 else 0, reps, state, self.counter.last_y)
        return annotated

class MediaPipeModel:
    def __init__(self):
        self.name = "MediaPipe"
        try:
            self.mp_pose = mp.solutions.pose
            self.pose = self.mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5, model_complexity=1)
            self.mp_drawing = mp.solutions.drawing_utils
            self.available = True
        except:
            self.available = False
        self.counter = RepCounter()

    def process(self, frame):
        if not self.available:
            dummy = frame.copy()
            cv2.putText(dummy, "MediaPipe N/A", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            return dummy

        start = time.time()
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image.flags.writeable = False
        results = self.pose.process(image)
        inf_ms = (time.time() - start) * 1000
        
        image.flags.writeable = True
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
        
        hip_y = 0
        if results.pose_landmarks:
            self.mp_drawing.draw_landmarks(image, results.pose_landmarks, self.mp_pose.POSE_CONNECTIONS)
            hip_y = results.pose_landmarks.landmark[self.mp_pose.PoseLandmark.LEFT_HIP].y
            
        reps, state = self.counter.update(hip_y)
        draw_stats(image, self.name, inf_ms, 1000/inf_ms if inf_ms > 0 else 0, reps, state, self.counter.last_y)
        return image

class MoveNetModel:
    def __init__(self, name="MoveNet"):
        self.name = name
        # Thunder is higher accuracy, Lightning is faster
        try:
            model_url = "https://tfhub.dev/google/movenet/singlepose/thunder/4"
            self.model = hub.load(model_url)
            self.movenet = self.model.signatures['serving_default']
            self.available = True
        except Exception as e:
            print(f"MoveNet Load Error: {e}")
            self.available = False
        self.counter = RepCounter()

    def process(self, frame):
        if not self.available:
            dummy = frame.copy()
            cv2.putText(dummy, "MoveNet N/A", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            return dummy

        start = time.time()
        # Resize to 256x256 for Thunder
        input_image = tf.image.resize_with_pad(tf.expand_dims(frame, axis=0), 256, 256)
        input_image = tf.cast(input_image, dtype=tf.int32)

        outputs = self.movenet(input_image)
        keypoints = outputs['output_0'].numpy()[0][0] # [17, 3] (y, x, conf)
        
        inf_ms = (time.time() - start) * 1000
        
        annotated = frame.copy()
        h, w, _ = annotated.shape
        
        # Draw Keypoints
        hip_y = 0
        for i, kp in enumerate(keypoints):
            ky, kx, conf = kp
            if conf > 0.3:
                cv2.circle(annotated, (int(kx * w), int(ky * h)), 5, (0, 255, 255), -1)
                if i == 11: # Left Hip
                    hip_y = ky 

        reps, state = self.counter.update(hip_y)
        draw_stats(annotated, self.name, inf_ms, 1000/inf_ms if inf_ms > 0 else 0, reps, state, self.counter.last_y)
        return annotated

# --- MAIN ---
def run_benchmark():
    cap = cv2.VideoCapture(INPUT_VIDEO)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    
    # Setup Models
    models = [
        YOLOModel('yolov8n-pose.pt'),
        YOLOModel('yolov8s-pose.pt'),
        MediaPipeModel(),
        MoveNetModel('MoveNet Thunder')
    ]
    
    # Setup Output
    # Grid: 2x2. Output size = (TARGET_SIZE[0]*2, TARGET_SIZE[1]*2)
    grid_w = TARGET_SIZE[0] * 2
    grid_h = TARGET_SIZE[1] * 2
    out = cv2.VideoWriter(OUTPUT_VIDEO, cv2.VideoWriter_fourcc(*'mp4v'), fps, (grid_w, grid_h))

    frame_count = 0
    print("Starting Benchmark loop...")

    while True:
        ret, frame = cap.read()
        if not ret: break
        
        processed_frames = []
        for model in models:
            res = model.process(frame.copy())
            resized = cv2.resize(res, TARGET_SIZE)
            processed_frames.append(resized)
            
        # Compose Grid
        top = np.hstack((processed_frames[0], processed_frames[1]))
        bottom = np.hstack((processed_frames[2], processed_frames[3]))
        grid = np.vstack((top, bottom))
        
        out.write(grid)
        frame_count += 1
        if frame_count % 10 == 0:
            print(f"Processed {frame_count} frames...")
        
        # Cap at 300 frames for speed (approx 5-10s of video)
        if frame_count >= 300:
            print("Reached frame cap (300). Stopping...")
            break

    cap.release()
    out.release()
    print(f"Done! Saved to {OUTPUT_VIDEO}")

if __name__ == '__main__':
    run_benchmark()
