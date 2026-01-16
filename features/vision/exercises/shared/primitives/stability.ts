import { Point } from '../types';

export class StabilityMonitor {
    private history: Point[] = [];
    private windowSize: number;
    private threshold: number;

    constructor(windowSize = 5, threshold = 5) {
        this.windowSize = windowSize;
        this.threshold = threshold;
    }

    public addPoint(p: Point): void {
        this.history.push(p);
        if (this.history.length > this.windowSize) {
            this.history.shift();
        }
    }

    public isStable(): boolean {
        if (this.history.length < this.windowSize) return false;

        const first = this.history[0];
        return this.history.every(p => {
            const dx = Math.abs(p.x - first.x);
            const dy = Math.abs(p.y - first.y);
            return Math.sqrt(dx * dx + dy * dy) < this.threshold;
        });
    }

    public getVariance(): number {
        if (this.history.length < 2) return 0;
        // Simple variance calculation for debug
        return 0; // Placeholder
    }
}
