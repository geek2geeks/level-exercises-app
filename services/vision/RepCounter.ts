import { Keypoint, Pose, PoseLandmark } from '@types/vision';

export enum ExerciseState {
    UP = 'UP',
    DOWN = 'DOWN',
}

export class RepCounter {
    private count: number = 0;
    private state: ExerciseState = ExerciseState.UP;
    private buffer: number[] = [];
    private readonly BUFFER_SIZE = 5;

    // Thresholds for Squat (Hip-Knee-Ankle angle)
    // Standing: ~170-180 degrees
    // Squat Depth: < 90-100 degrees
    private readonly UP_THRESHOLD = 160;
    private readonly DOWN_THRESHOLD = 100;

    constructor() { }

    public update(pose: Pose): { count: number; state: ExerciseState; angle: number; isDetected: boolean } {
        const leftHip = pose.keypoints[PoseLandmark.LEFT_HIP];
        const leftKnee = pose.keypoints[PoseLandmark.LEFT_KNEE];
        const leftAnkle = pose.keypoints[PoseLandmark.LEFT_ANKLE];

        // Ensure high enough confidence
        if (leftHip.score < 0.3 || leftKnee.score < 0.3 || leftAnkle.score < 0.3) {
            return { count: this.count, state: this.state, angle: 0, isDetected: false };
        }

        const angle = this.calculateAngle(leftHip, leftKnee, leftAnkle);
        const smoothedAngle = this.smoothValue(angle);

        this.processState(smoothedAngle);

        return {
            count: this.count,
            state: this.state,
            angle: smoothedAngle,
            isDetected: true,
        };
    }

    private calculateAngle(a: Keypoint, b: Keypoint, c: Keypoint): number {
        const rad = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let deg = Math.abs(rad * (180.0 / Math.PI));
        if (deg > 180.0) {
            deg = 360.0 - deg;
        }
        return deg;
    }

    private smoothValue(val: number): number {
        this.buffer.push(val);
        if (this.buffer.length > this.BUFFER_SIZE) {
            this.buffer.shift();
        }
        const sum = this.buffer.reduce((a, b) => a + b, 0);
        return sum / this.buffer.length;
    }

    private processState(angle: number) {
        if (this.state === ExerciseState.UP) {
            if (angle < this.DOWN_THRESHOLD) {
                this.state = ExerciseState.DOWN;
            }
        } else if (this.state === ExerciseState.DOWN) {
            if (angle > this.UP_THRESHOLD) {
                this.state = ExerciseState.UP;
                this.count++;
            }
        }
    }

    public reset() {
        this.count = 0;
        this.state = ExerciseState.UP;
        this.buffer = [];
    }
}
