import { Platform } from 'react-native';

export interface DeviceCapabilities {
    supportsNnapi: boolean;
    supportsGpu: boolean;
    recommendedDelegate: 'android-gpu' | 'nnapi' | 'cpu' | 'core-ml';
    androidApiLevel: number;
}

export const getDeviceCapabilities = async (): Promise<DeviceCapabilities> => {
    if (Platform.OS === 'ios') {
        return {
            supportsNnapi: false, // Android only
            supportsGpu: true,    // Metal is available on all supported iOS devices
            recommendedDelegate: 'core-ml',
            androidApiLevel: 0
        };
    }

    // On Android, Platform.Version is the API Level (integer)
    const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : parseInt(String(Platform.Version), 10);

    // NNAPI is deprecated in Android 15 (API 35) but useful for older devices with NPU.
    // We avoid it on API 35+.
    const supportsNnapi = apiLevel >= 27 && apiLevel < 35;

    // GPU Delegate (OpenGL/OpenCL)
    // Generally safe on API 21+, but reliable on 26+.
    const supportsGpu = apiLevel >= 26;

    let recommended: 'android-gpu' | 'nnapi' | 'cpu' | 'core-ml' = 'cpu';

    if (supportsGpu) {
        recommended = 'android-gpu';
    } else if (supportsNnapi) {
        recommended = 'nnapi';
    }

    return {
        supportsNnapi,
        supportsGpu,
        recommendedDelegate: recommended,
        androidApiLevel: apiLevel
    };
};
