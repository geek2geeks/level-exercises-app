import { Point } from './types';

/**
 * Calculates the angle between three points (A, B, C) where B is the vertex.
 * Returns angle in degrees.
 */
export function calculateAngle(a: Point, b: Point, c: Point): number {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);

    if (angle > 180.0) {
        angle = 360 - angle;
    }

    return angle;
}

/**
 * Returns vertical alignment score (0-1) where 1 is perfectly vertical.
 */
export function getVerticalAlignment(p1: Point, p2: Point): number {
    const dx = Math.abs(p1.x - p2.x);
    const dy = Math.abs(p1.y - p2.y);
    if (dy === 0) return 0;

    // Angle from vertical
    const angle = Math.atan2(dx, dy) * (180 / Math.PI);
    return Math.max(0, 1 - angle / 90);
}
