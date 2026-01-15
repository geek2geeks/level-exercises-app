import cv2

VIDEO_PATH = "assets/squats/WhatsApp Video 2026-01-11 at 23.41.14.mp4"
OUTPUT_PATH = "scripts/vision-spike/debug_squat.jpg"

cap = cv2.VideoCapture(VIDEO_PATH)
if not cap.isOpened():
    print("Error opening video")
    exit()

# Jump to frame 180 (~3s)
cap.set(cv2.CAP_PROP_POS_FRAMES, 180)
ret, frame = cap.read()

if ret:
    cv2.imwrite(OUTPUT_PATH, frame)
    print(f"Saved {OUTPUT_PATH}")
else:
    print("Failed to read frame")

cap.release()
