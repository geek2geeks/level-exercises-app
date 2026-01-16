export interface CropRegion {
    x: number;      // Top-left X (in frame coordinates)
    y: number;      // Top-left Y (in frame coordinates)
    width: number;  // Crop width
    height: number; // Crop height
}

export interface Keypoint {
    x: number;      // Normalized [0, 1] relative to the PREVIOUS CROP
    y: number;      // Normalized [0, 1] relative to the PREVIOUS CROP
    score: number;
}

const TORSO_INDICES = [5, 6, 11, 12]; // shoulders + hips
// Full body indices for bounding box
const BODY_INDICES = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const MIN_CROP_SIZE_RATIO = 0.2; // Minimum crop as fraction of frame min dimension
const PADDING_FACTOR = 1.25; // Add 25% padding around person

// Helper to clamp crop region to frame boundaries
function clampCropRegion(crop: CropRegion, frameWidth: number, frameHeight: number): CropRegion {
    'worklet';
    let { x, y, width, height } = crop;

    // If crop is larger than frame, clamp size
    if (width > frameWidth) { x = 0; width = frameWidth; }
    if (height > frameHeight) { y = 0; height = frameHeight; }

    // Shift to fit
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x + width > frameWidth) x = frameWidth - width;
    if (y + height > frameHeight) y = frameHeight - height;

    return { x, y, width, height };
}

/**
 * Calculates the next crop region based on the previous frame's keypoints.
 * MoveNet logic: https://www.tensorflow.org/hub/tutorials/movenet
 */
export function determineCropRegion(
    keypoints: Keypoint[] | null,
    frameWidth: number,
    frameHeight: number,
    previousCrop: CropRegion | null
): CropRegion {
    'worklet';

    // Helper for centered square (inlined to avoid worklet scope issues)
    const getCenteredSquare = () => {
        'worklet';
        const size = Math.min(frameWidth, frameHeight);
        return {
            x: (frameWidth - size) / 2,
            y: (frameHeight - size) / 2,
            width: size,
            height: size
        };
    };

    // Default to center square crop if no history
    if (!keypoints || !previousCrop || keypoints.length === 0) {
        return getCenteredSquare();
    }

    // 1. Check if we have a valid detection ("Person visible")
    // Torso keypoints are critical. If they aren't confident, we might have lost tracking.
    const torsoVisible = TORSO_INDICES.every(i => (keypoints[i]?.score ?? 0) > 0.2);

    if (!torsoVisible) {
        return getCenteredSquare();
    }

    // 2. Calculate bounding box of visible body keypoints IN PREVIOUS CROP COORDINATES
    const visiblePoints = BODY_INDICES
        .filter(i => (keypoints[i]?.score ?? 0) > 0.2)
        .map(i => keypoints[i]);

    if (visiblePoints.length < 3) {
        return getCenteredSquare();
    }

    const minX = Math.min(...visiblePoints.map(p => p.x));
    const maxX = Math.max(...visiblePoints.map(p => p.x));
    const minY = Math.min(...visiblePoints.map(p => p.y));
    const maxY = Math.max(...visiblePoints.map(p => p.y));

    // 3. Map these normalized coordinates back to absolute frame coordinates
    const absMinX = previousCrop.x + minX * previousCrop.width;
    const absMaxX = previousCrop.x + maxX * previousCrop.width;
    const absMinY = previousCrop.y + minY * previousCrop.height;
    const absMaxY = previousCrop.y + maxY * previousCrop.height;

    // 4. Calculate center and size of the new bounding box
    const centerX = (absMinX + absMaxX) / 2;
    const centerY = (absMinY + absMaxY) / 2;

    const bodyWidth = absMaxX - absMinX;
    const bodyHeight = absMaxY - absMinY;

    // MoveNet requires square inputs. Use max dim + padding.
    const maxDim = Math.max(bodyWidth, bodyHeight);
    const cropSize = maxDim * PADDING_FACTOR;

    // Ensure crop isn't too small (noise sensitivity)
    const minDimension = Math.min(frameWidth, frameHeight);
    const finalSize = Math.max(cropSize, minDimension * MIN_CROP_SIZE_RATIO);

    // 5. Calculate new generic crop rect centered on body
    const cropX = centerX - finalSize / 2;
    const cropY = centerY - finalSize / 2;

    // 6. Clamp to frame boundaries
    return clampCropRegion({
        x: cropX,
        y: cropY,
        width: finalSize,
        height: finalSize
    }, frameWidth, frameHeight);
}
