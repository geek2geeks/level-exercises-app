import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Config
CSV_PATH = 'scripts/vision-spike/benchmark_results.csv'
# Simple thresholds - in a real app these would be calibrated or relative
STANDING_THRESHOLD = 0.50 # Normalized Y (0 is top, 1 is bottom). Hip higher = smaller Y.
SQUAT_THRESHOLD = 0.60    # Hip lower = larger Y.

def analyze_reps():
    df = pd.read_csv(CSV_PATH)
    # Filter for YOLO data if multiple models exist
    df = df[df['model'] == 'YOLOv8n'].copy()
    
    # Simple moving average to smooth jitter
    df['hip_y_smooth'] = df['hip_y'].rolling(window=5).mean()
    
    reps = 0
    state = 'STANDING' # STANDING, DESCENDING, BOTTOM, ASCENDING
    
    rep_log = []

    for i, row in df.iterrows():
        y = row['hip_y_smooth']
        if pd.isna(y): continue

        # Simple State Machine
        if state == 'STANDING':
            if y > SQUAT_THRESHOLD:
                state = 'BOTTOM'
        
        elif state == 'BOTTOM':
            if y < STANDING_THRESHOLD:
                state = 'STANDING'
                reps += 1
                rep_log.append(f"Rep {reps} completed at frame {i}")

    print(f"Total Reps Counted: {reps}")
    print("\nLog:")
    for log in rep_log:
        print(log)

    # Optional: Plot
    plt.figure(figsize=(10, 5))
    plt.plot(df['hip_y_smooth'], label='Hip Y (Smoothed)')
    plt.axhline(y=STANDING_THRESHOLD, color='g', linestyle='--', label='Stand Thr')
    plt.axhline(y=SQUAT_THRESHOLD, color='r', linestyle='--', label='Squat Thr')
    plt.legend()
    plt.title("Squat Detection Signal")
    plt.savefig('scripts/vision-spike/rep_analysis.png')

if __name__ == '__main__':
    analyze_reps()
