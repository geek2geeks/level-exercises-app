import cv2
import time
import mediapipe as mp
import numpy as np
import pandas as pd
from ultralytics import YOLO
from tqdm import tqdm

INPUT_VIDEO = 'scripts/vision-spike/input.mp4'
OUTPUT_DIR = 'scripts/vision-spike/'

# --- MediaPipe Setup ---
try:
    mp_pose = mp.solutions.pose
    mp_drawing = mp.solutions.drawing_utils
    MP_AVAILABLE = True
except AttributeError:
    print("MediaPipe 'solutions' not found. Skipping MediaPipe.")
    MP_AVAILABLE = False
except Exception as e:
    print(f"MediaPipe error: {e}")
    MP_AVAILABLE = False

# --- YOLO Setup ---
# Automatically downloads 'yolov8n-pose.pt' if not present
yolo_model = YOLO('yolov8n-pose.pt') 

def run_mediapipe(video_path):
    if not MP_AVAILABLE:
        return []
    print("Running MediaPipe...")
    cap = cv2.VideoCapture(video_path)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    out = cv2.VideoWriter(OUTPUT_DIR + 'output_mediapipe.mp4', 
                          cv2.VideoWriter_fourcc(*'mp4v'), fps, (width, height))

    data = []
    
    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5, model_complexity=1) as pose:
        start_time = time.time()
        
        for _ in tqdm(range(total_frames), desc="MediaPipe"):
            ret, frame = cap.read()
            if not ret: break

            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image.flags.writeable = False
            
            frame_start = time.time()
            results = pose.process(image)
            inference_time = (time.time() - frame_start) * 1000 # ms

            image.flags.writeable = True
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

            mp_drawing.draw_landmarks(image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
            out.write(image)

            # Log Hip Y for jitter analysis
            hip_y = 0
            conf = 0
            if results.pose_landmarks:
                landmark = results.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_HIP]
                hip_y = landmark.y
                conf = landmark.visibility

            data.append({
                'model': 'MediaPipe',
                'inference_ms': inference_time,
                'hip_y': hip_y,
                'confidence': conf
            })

    cap.release()
    out.release()
    return data

def run_yolo(video_path):
    print("Running YOLOv8n-Pose...")
    cap = cv2.VideoCapture(video_path)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    out = cv2.VideoWriter(OUTPUT_DIR + 'output_yolo.mp4', 
                          cv2.VideoWriter_fourcc(*'mp4v'), fps, (width, height))

    data = []
    
    for _ in tqdm(range(total_frames), desc="YOLOv8"):
        ret, frame = cap.read()
        if not ret: break

        frame_start = time.time()
        results = yolo_model(frame, verbose=False)
        inference_time = (time.time() - frame_start) * 1000

        # Plot creates a BGR numpy array
        annotated_frame = results[0].plot()
        out.write(annotated_frame)

        # Extract Keypoints (Left Hip is index 11 in COCO keypoints, same as MP usually)
        # YOLO keypoints: [x, y, conf]
        keypoints_xyn = results[0].keypoints.xyn.cpu().numpy() # [Batch, 17, 2]
        keypoints_conf = results[0].keypoints.conf # [Batch, 17]
        
        hip_y = 0
        conf = 0
        if keypoints_xyn.shape[1] > 0:
             # Index 11 is Left Hip
            hip_y = keypoints_xyn[0][11][1]
            
            if keypoints_conf is not None:
                conf = keypoints_conf.cpu().numpy()[0][11]

        data.append({
            'model': 'YOLOv8n',
            'inference_ms': inference_time,
            'hip_y': hip_y,
            'confidence': conf
        })

    cap.release()
    out.release()
    return data

if __name__ == '__main__':
    print(f"Processing {INPUT_VIDEO}")
    
    mp_data = run_mediapipe(INPUT_VIDEO)
    yolo_data = run_yolo(INPUT_VIDEO)

    df = pd.DataFrame(mp_data + yolo_data)
    df.to_csv(OUTPUT_DIR + 'benchmark_results.csv', index=False)
    
    print("Done! Results saved to scripts/vision-spike/")
    print(df.groupby('model')['inference_ms'].describe())
