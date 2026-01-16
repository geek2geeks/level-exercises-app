import { ExerciseState, Pose } from './types';

export abstract class BaseExerciseAnalyzer {
    protected state: ExerciseState = ExerciseState.IDLE;
    protected repCount = 0;
    protected lastStateChange = Date.now();

    /**
     * Main entry point for each frame
     */
    public abstract analyzeFrame(pose: Pose): void;

    public getRepCount(): number {
        return this.repCount;
    }

    public getState(): ExerciseState {
        return this.state;
    }

    protected setState(newState: ExerciseState): void {
        if (this.state !== newState) {
            this.state = newState;
            this.lastStateChange = Date.now();
            console.log(`Exercise State Change: ${newState}`);
        }
    }
}
