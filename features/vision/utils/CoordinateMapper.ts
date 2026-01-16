
interface Dimensions {
    width: number;
    height: number;
}

interface CropRegion {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Maps a normalized coordinate (0-1) from a cropped model input back to the full camera frame.
 */
export const mapNormalizedToCamera = (
    x: number,
    y: number,
    crop: CropRegion
): { x: number; y: number } => {
    'worklet';
    return {
        x: crop.x + x * crop.width,
        y: crop.y + y * crop.height,
    };
};

/**
 * Maps a camera frame coordinate to the screen coordinate system, assuming "cover" resize mode.
 * 
 * @param x Camera X
 * @param y Camera Y
 * @param cameraWidth Width of the camera frame
 * @param cameraHeight Height of the camera frame
 * @param screenWidth Width of the screen/view
 * @param screenHeight Height of the screen/view
 */
export const mapCameraToScreen = (
    x: number,
    y: number,
    cameraWidth: number,
    cameraHeight: number,
    screenWidth: number,
    screenHeight: number
): { x: number; y: number } => {
    'worklet';

    // Calculate the scale factor for "cover" mode
    const scale = Math.max(screenWidth / cameraWidth, screenHeight / cameraHeight);

    const scaledWidth = cameraWidth * scale;
    const scaledHeight = cameraHeight * scale;

    // Center alignment offsets
    const xOffset = (scaledWidth - screenWidth) / 2;
    const yOffset = (scaledHeight - screenHeight) / 2;

    return {
        x: (x * scale) - xOffset,
        y: (y * scale) - yOffset,
    };
};

/**
 * Maps a camera-frame pixel coordinate to screen coordinates, accounting for
 * orientation/mirroring and assuming "cover" resize mode.
 */
export const mapCameraPointToScreen = (
    x: number,
    y: number,
    cameraWidth: number,
    cameraHeight: number,
    screenWidth: number,
    screenHeight: number,
    orientation: 'portrait' | 'portrait-upside-down' | 'landscape-left' | 'landscape-right' = 'portrait',
    isMirrored: boolean = false
): { x: number; y: number } => {
    'worklet';

    // Normalize to camera space
    let nx = x / cameraWidth;
    let ny = y / cameraHeight;

    // Rotate to match screen orientation
    if (orientation === 'landscape-left') {
        const rx = ny;
        const ry = 1 - nx;
        nx = rx;
        ny = ry;
    } else if (orientation === 'landscape-right') {
        const rx = 1 - ny;
        const ry = nx;
        nx = rx;
        ny = ry;
    } else if (orientation === 'portrait-upside-down') {
        nx = 1 - nx;
        ny = 1 - ny;
    }

    // Mirror (front camera)
    if (isMirrored) {
        nx = 1 - nx;
    }

    // Rotated camera dimensions
    const rotatedWidth = (orientation === 'landscape-left' || orientation === 'landscape-right')
        ? cameraHeight
        : cameraWidth;
    const rotatedHeight = (orientation === 'landscape-left' || orientation === 'landscape-right')
        ? cameraWidth
        : cameraHeight;

    const rotatedX = nx * rotatedWidth;
    const rotatedY = ny * rotatedHeight;

    return mapCameraToScreen(rotatedX, rotatedY, rotatedWidth, rotatedHeight, screenWidth, screenHeight);
};

/**
 * Maps normalized model output (0-1) in the model input space back to the screen.
 * Use this when the model input is a crop of the camera frame.
 */
export const mapModelToScreenWithCrop = (
    x: number,
    y: number,
    crop: CropRegion,
    cameraWidth: number,
    cameraHeight: number,
    screenWidth: number,
    screenHeight: number,
    orientation: 'portrait' | 'portrait-upside-down' | 'landscape-left' | 'landscape-right' = 'portrait',
    isMirrored: boolean = false
): { x: number; y: number } => {
    'worklet';

    const cameraPoint = mapNormalizedToCamera(x, y, crop);
    return mapCameraPointToScreen(
        cameraPoint.x,
        cameraPoint.y,
        cameraWidth,
        cameraHeight,
        screenWidth,
        screenHeight,
        orientation,
        isMirrored
    );
};

/**
 * Combined helper: Maps normalized model output (0-1) from a square center crop
 * directly to screen coordinates (Cover mode).
 */
export const mapModelToScreen = (
    x: number,
    y: number,
    cameraWidth: number,
    cameraHeight: number,
    screenWidth: number,
    screenHeight: number,
    orientation: 'portrait' | 'portrait-upside-down' | 'landscape-left' | 'landscape-right' = 'portrait',
    isMirrored: boolean = false
): { x: number; y: number } => {
    'worklet';

    // Default: model input was a center square crop
    const size = Math.min(cameraWidth, cameraHeight);
    const crop: CropRegion = {
        x: (cameraWidth - size) / 2,
        y: (cameraHeight - size) / 2,
        width: size,
        height: size,
    };

    return mapModelToScreenWithCrop(
        x,
        y,
        crop,
        cameraWidth,
        cameraHeight,
        screenWidth,
        screenHeight,
        orientation,
        isMirrored
    );
};
