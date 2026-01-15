import cv2
import os

VIDEO_PATH = 'scripts/vision-spike/comparison_output.mp4'
OUTPUT_DIR = 'scripts/vision-spike/debug_frames/'

def extract_frames():
    cap = cv2.VideoCapture(VIDEO_PATH)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    # Points to sample
    indices = [int(total_frames * 0.2), int(total_frames * 0.5), int(total_frames * 0.8)]
    
    for idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if ret:
            cv2.imwrite(f"{OUTPUT_DIR}frame_{idx}.jpg", frame)
            print(f"Saved frame_{idx}.jpg")
            
    cap.release()

if __name__ == '__main__':
    extract_frames()
