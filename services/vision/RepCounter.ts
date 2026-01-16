import { Keypoint, Pose, PoseLandmark } from '../../types/vision';

export enum ExerciseState {
    UP = 'UP',
    DOWN = 'DOWN',
}

// OneEuroFilter implementation for smoothing
class OneEuroFilter {
    private minCutoff: number;
    private beta: number;
    private dCutoff: number;
    private xPrev: number | null = null;
    private dxPrev: number | null = null;
    private tPrev: number | null = null;

    constructor(minCutoff: number = 1.0, beta: number = 0.0, dCutoff: number = 1.0) {
        this.minCutoff = minCutoff;
        this.beta = beta;
        this.dCutoff = dCutoff;
    }

    filter(t: number, x: number): number {
        if (this.xPrev === null) {
            this.xPrev = x;
            this.dxPrev = 0;
            this.tPrev = t;
            return x;
        }

        const dt = (t - (this.tPrev || t)) / 1000.0; // convert ms to seconds
        this.tPrev = t;

        if (dt <= 0) return this.xPrev; // duplicate timestamp, return prev

        const alphaD = this.smoothingFactor(dt, this.dCutoff);
        const dx = (x - this.xPrev) * alphaD + (this.dxPrev || 0) * (1 - alphaD);

        const edx = Math.abs(dx);
        const cutoff = this.minCutoff + this.beta * edx;
        const alpha = this.smoothingFactor(dt, cutoff);

        const xHat = x * alpha + this.xPrev * (1 - alpha);

        this.xPrev = xHat;
        this.dxPrev = dx;

        return xHat;
    }

    private smoothingFactor(dt: number, cutoff: number): number {
        const r = 2 * Math.PI * cutoff * dt;
        return r / (r + 1);
    }

    reset() {
        this.xPrev = null;
        this.dxPrev = null;
        this.tPrev = null;
    }
}

export class RepCounter {
    private count: number = 0;
    private state: ExerciseState = ExerciseState.UP;
    private filter: OneEuroFilter;

    // Thresholds for Squat (Hip-Knee-Ankle angle)
    // Standing: ~170-180 degrees
    // Squat Depth: < 130 degrees (Aligned with Benchmark v4)
    private readonly UP_THRESHOLD = 160;
    private readonly DOWN_THRESHOLD = 130;

    // Confidence Threshold - lowered from 0.45 to 0.3 for better tracking reliability
    private readonly CONFIDENCE_THRESHOLD = 0.3;

    constructor() {
        // Tuned params for human motion smoothing
        this.filter = new OneEuroFilter(1.0, 0.007, 1.0);
    }

    public update(pose: Pose, frameTimestamp?: number): { count: number; state: ExerciseState; angle: number; isDetected: boolean } {
        const leftHip = pose.keypoints[PoseLandmark.LEFT_HIP];
        const leftKnee = pose.keypoints[PoseLandmark.LEFT_KNEE];
        const leftAnkle = pose.keypoints[PoseLandmark.LEFT_ANKLE];

        // Ensure high enough confidence
        if (leftHip.score < this.CONFIDENCE_THRESHOLD ||
            leftKnee.score < this.CONFIDENCE_THRESHOLD ||
            leftAnkle.score < this.CONFIDENCE_THRESHOLD) {
            // TODO: Implement 'LOST' state if needed, for now just return last known legit state
            return { count: this.count, state: this.state, angle: 0, isDetected: false };
        }

        const rawAngle = this.calculateAngle(leftHip, leftKnee, leftAnkle);
        // Use provided frame timestamp (ms) or fallback to Date.now()
        const timestamp = frameTimestamp ?? Date.now();
        const smoothedAngle = this.filter.filter(timestamp, rawAngle);

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
        this.filter.reset();
    }
}
