import cv2
import time
import numpy as np
import tensorflow as tf
from ultralytics import YOLO
import mediapipe as mp
from collections import deque
import math

# --- CONFIG ---
INPUT_VIDEO = 'assets/squats/WhatsApp Video 2026-01-11 at 23.41.14.mp4'
OUTPUT_VIDEO = 'scripts/vision-spike/benchmark_results.mp4'
TARGET_SIZE = (480, 480) # Resize for visualization

# --- REP COUNTER (MATCHING APP LOGIC) ---
class ExerciseState:
    UP = 'UP'
    DOWN = 'DOWN'

class RepCounter:
    def __init__(self):
        self.count = 0
        self.state = ExerciseState.UP
        self.buffer = deque(maxlen=5)
        # Thresholds from RepCounter.ts (Relaxed for Front View)
        self.UP_THRESHOLD = 160
        self.DOWN_THRESHOLD = 130
    
    def calculate_angle(self, a, b, c):
        # a, b, c are (x, y) tuples
        rad = math.atan2(c[1] - b[1], c[0] - b[0]) - math.atan2(a[1] - b[1], a[0] - b[0])
        deg = abs(rad * (180.0 / math.pi))
        if deg > 180.0:
            deg = 360.0 - deg
        return deg

    def update(self, hip, knee, ankle, confs):
        # confs is list of scores [hip, knee, ankle]
        if any(c < 0.3 for c in confs):
            return self.count, self.state, 0

        angle = self.calculate_angle(hip, knee, ankle)
        
        # Smooth
        self.buffer.append(angle)
        smoothed_angle = sum(self.buffer) / len(self.buffer)
        
        # DEBUG: Print angle occasionally
        # if int(smoothed_angle) % 10 == 0:
        #    print(f"Angle: {smoothed_angle:.1f}")

        # State Machine
        if self.state == ExerciseState.UP:
            if smoothed_angle < self.DOWN_THRESHOLD:
                self.state = ExerciseState.DOWN
        elif self.state == ExerciseState.DOWN:
            if smoothed_angle > self.UP_THRESHOLD:
                self.state = ExerciseState.UP
                self.count += 1
        
        return self.count, self.state, smoothed_angle

# --- UTILS ---
def draw_stats(image, model_name, inf_ms, fps, reps, state, angle):
    # Overlay
    overlay = image.copy()
    cv2.rectangle(overlay, (0, 0), (280, 150), (0, 0, 0), -1)
    alpha = 0.6
    cv2.addWeighted(overlay, alpha, image, 1 - alpha, 0, image)

    color = (0, 255, 0) if state == ExerciseState.UP else (0, 0, 255)
    
    cv2.putText(image, f"{model_name}", (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    cv2.putText(image, f"Inf: {inf_ms:.1f}ms", (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)
    cv2.putText(image, f"Angle: {int(angle)}", (10, 75), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
    cv2.putText(image, f"Reps: {reps}", (10, 110), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 0), 2)
    cv2.putText(image, f"{state}", (120, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

def center_crop_and_resize(frame, target_size=256):
    h, w, _ = frame.shape
    dim = min(h, w)
    
    # Center Crop
    start_x = (w - dim) // 2
    start_y = (h - dim) // 2
    cropped = frame[start_y:start_y+dim, start_x:start_x+dim]
    
    # Resize
    resized = cv2.resize(cropped, (target_size, target_size))
    return resized, dim, start_x, start_y

# --- MODELS ---

class YOLOModel:
    def __init__(self, name):
        self.name = name
        self.model = YOLO(name)
        self.counter = RepCounter()

    def process(self, frame):
        start = time.time()
        results = self.model(frame, verbose=False)
        inf_ms = (time.time() - start) * 1000
        annotated = frame.copy()

        # Extract Keypoints (Left Side: 11, 13, 15)
        angle = 0
        reps = self.counter.count
        state = self.counter.state

        if results and results[0].boxes:
            # Assume Person 0 is user
            kps = results[0].keypoints.xy.cpu().numpy()[0]
            scores = results[0].keypoints.conf.cpu().numpy()[0]
            
            if len(kps) > 15:
                start_p = 5 # Draw from shoulders down
                for i in range(5, 17):
                    pt = (int(kps[i][0]), int(kps[i][1]))
                    if scores[i] > 0.5:
                        cv2.circle(annotated, pt, 4, (0, 255, 255), -1)
                
                # Update Counter
                hip = kps[11]
                knee = kps[13]
                ankle = kps[15]
                confs = [scores[11], scores[13], scores[15]]
                
                reps, state, angle = self.counter.update(hip, knee, ankle, confs)

        draw_stats(annotated, self.name, inf_ms, 0, reps, state, angle)
        return annotated

class MoveNetTFLite:
    def __init__(self, model_path, name):
        self.name = name
        self.interpreter = tf.lite.Interpreter(model_path=model_path)
        self.interpreter.allocate_tensors()
        self.input_details = self.interpreter.get_input_details()
        self.output_details = self.interpreter.get_output_details()
        self.counter = RepCounter()

    def process(self, frame):
        start = time.time()
        
        # Get expected input shape
        input_shape = self.input_details[0]['shape']
        target_h, target_w = input_shape[1], input_shape[2]

        # Preprocess: Center Crop -> Target Size -> Uint8
        resized_img, dim, off_x, off_y = center_crop_and_resize(frame, target_w) # Assumes w=h
        input_data = np.expand_dims(resized_img, axis=0) # [1, H, W, 3]
        
        # Inference
        self.interpreter.set_tensor(self.input_details[0]['index'], input_data)
        self.interpreter.invoke()
        
        # Output: [1, 1, 17, 3]
        output_data = self.interpreter.get_tensor(self.output_details[0]['index'])
        keypoints = output_data[0][0] # [17, 3] -> (y, x, conf) normalized 0-1 relative to CROP

        inf_ms = (time.time() - start) * 1000
        
        annotated = frame.copy()
        
        # Map Back to Original Frame
        real_kps = []
        scores = []
        
        for kp in keypoints:
            ky, kx, conf = kp
            # Remap: values are relative to 256x256 crop
            # real_x = (kx * dim) + off_x
            real_x = (kx * dim) + off_x
            real_y = (ky * dim) + off_y
            real_kps.append((real_x, real_y))
            scores.append(conf)
            
            if conf > 0.3:
                cv2.circle(annotated, (int(real_x), int(real_y)), 5, (255, 0, 255), -1)

        # Update Counter (Left: 11, 13, 15)
        hip = real_kps[11]
        knee = real_kps[13]
        ankle = real_kps[15]
        confs = [scores[11], scores[13], scores[15]]
        
        reps, state, angle = self.counter.update(hip, knee, ankle, confs)
        
        draw_stats(annotated, self.name, inf_ms, 0, reps, state, angle)
        return annotated

# --- MAIN ---
def run_benchmark():
    cap = cv2.VideoCapture(INPUT_VIDEO)
    if not cap.isOpened():
        print(f"Error opening video: {INPUT_VIDEO}")
        return

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)

    print(f"Video: {width}x{height} @ {fps}fps")

    models = [
        MoveNetTFLite('assets/models/movenet_thunder_int8.tflite', 'Thunder Int8'),
        MoveNetTFLite('assets/models/movenet_lightning_int8.tflite', 'Lightning Int8'),
        YOLOModel('yolov8n-pose.pt'),
        # YOLOModel('yolov8s-pose.pt'),
    ]

    # Output grid setup
    grid_w = TARGET_SIZE[0] * 3 
    grid_h = TARGET_SIZE[1] # 1x3 row
    
    out = cv2.VideoWriter(OUTPUT_VIDEO, cv2.VideoWriter_fourcc(*'mp4v'), fps, (grid_w, grid_h))

    frame_count = 0
    while True:
        ret, frame = cap.read()
        if not ret: break

        processed = []
        for m in models:
            res = m.process(frame.copy())
            resized = cv2.resize(res, TARGET_SIZE)
            processed.append(resized)

        grid = np.hstack(processed)
        out.write(grid)
        
        frame_count += 1
        if frame_count % 30 == 0:
            print(f"Processed {frame_count} frames... Reps: {[m.counter.count for m in models]}")

    cap.release()
    out.release()
    print("Benchmark Complete.")
    
    # Summary
    print("\n--- RESULTS ---")
    for m in models:
        print(f"{m.name}: {m.counter.count} reps detected.")

if __name__ == '__main__':
    run_benchmark()
