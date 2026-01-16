export interface Keypoint {
    x: number;
    y: number;
    score: number;
    name?: string;
}

export type Point = {
    x: number;
    y: number;
};

export interface Pose {
    keypoints: Keypoint[];
    score: number;
    bbox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

export enum ExerciseState {
    IDLE = 'idle',
    PREPARING = 'preparing',
    START = 'start',
    DESCENDING = 'descending',
    BOTTOM = 'bottom',
    ASCENDING = 'ascending',
    COMPLETED = 'completed',
}

export interface MetricResult {
    value: number;
    isValid: boolean;
    violationCode?: string;
    feedback?: string;
}
