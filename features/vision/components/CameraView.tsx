import { Ionicons } from '@expo/vector-icons';
import { ModelType, poseDetectionService } from '@services/vision/PoseDetectionService';
import { ExerciseState, RepCounter } from '@services/vision/RepCounter';
import { Canvas, Circle, Line, Rect, Skia, Text as SkiaText } from '@shopify/react-native-skia';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import {
    Camera,
    CameraPosition,
    PhysicalCameraDeviceType,
    runAtTargetFps,
    useCameraDevice,
    useCameraDevices,
    useCameraFormat,
    useCameraPermission,
    useFrameProcessor
} from 'react-native-vision-camera';
import { Worklets, useSharedValue } from 'react-native-worklets-core';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { mapCameraPointToScreen, mapModelToScreen, mapModelToScreenWithCrop } from '../utils/CoordinateMapper';
import { CropRegion, determineCropRegion } from '../utils/CropRegionCalculator';

// MoveNet Keypoint Indices (0-16)
// Source: TensorFlow MoveNet tutorial (KEYPOINT_DICT)
const KEYPOINT_LABELS: string[] = [
    'nose',
    'left_eye',
    'right_eye',
    'left_ear',
    'right_ear',
    'left_shoulder',
    'right_shoulder',
    'left_elbow',
    'right_elbow',
    'left_wrist',
    'right_wrist',
    'left_hip',
    'right_hip',
    'left_knee',
    'right_knee',
    'left_ankle',
    'right_ankle'
];

const KEYPOINT_PAIRS = [
    [0, 1], [0, 2],
    [1, 3], [2, 4],
    [0, 5], [0, 6],
    [5, 7], [7, 9],       // Left Arm
    [6, 8], [8, 10],      // Right Arm
    [5, 6],               // Shoulders
    [5, 11], [6, 12],     // Torso
    [11, 12],             // Hips
    [11, 13], [13, 15],   // Left Leg
    [12, 14], [14, 16]    // Right Leg
];

type PoseKeypoint = { x: number; y: number; score: number };

type DelegatePref = 'best' | 'default' | 'cpu' | 'nnapi' | 'gpu';

export const CameraView = () => {
    const { hasPermission, requestPermission } = useCameraPermission();
    const [cameraPosition, setCameraPosition] = useState<CameraPosition>('back');
    const [physicalDevice, setPhysicalDevice] = useState<PhysicalCameraDeviceType | 'auto'>('auto');
    const [exerciseState, setExerciseState] = useState<ExerciseState>(ExerciseState.UP);
    const [repCount, setRepCount] = useState(0);
    const [debugAngle, setDebugAngle] = useState(0);

    // Enumerate all cameras (multi-camera phones often expose multiple back devices)
    const allDevices = useCameraDevices();
    const device = useCameraDevice(
        cameraPosition,
        physicalDevice === 'auto' ? undefined : { physicalDevices: [physicalDevice] }
    );

    // Pick a stable format so FOV/resolution are known for angle calculations
    const format = useCameraFormat(device, [
        { fps: 30 },
        { videoResolution: { width: 1280, height: 720 } },
    ]);

    const { resize } = useResizePlugin();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    const [isModelReady, setIsModelReady] = useState(false);
    const [modelError, setModelError] = useState<string | null>(null);
    const [lastInferenceTime, setLastInferenceTime] = useState(0);
    const [avgScore, setAvgScore] = useState(0);

    // Visualization state (JS-driven for reliable Skia updates)
    const [detectedKeypoints, setDetectedKeypoints] = useState<PoseKeypoint[]>([]);
    const [cropRegion, setCropRegion] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const [frameDimensions, setFrameDimensions] = useState({ width: 0, height: 0 });
    const [frameOrientation, setFrameOrientation] = useState<'portrait' | 'portrait-upside-down' | 'landscape-left' | 'landscape-right'>('portrait');
    const [isFrameMirrored, setIsFrameMirrored] = useState(false);

    const repCounter = React.useRef(new RepCounter());

    // Model Switching State
    const [modelType, setModelType] = useState<ModelType>('movenet_thunder');
    const [debugLog, setDebugLog] = useState("Init...");
    const [isDetected, setIsDetected] = useState(false);
    const [isAIActive] = useState(true); // Always Active now
    const [delegate, setDelegate] = useState<DelegatePref>('best');
    const [activeDelegate, setActiveDelegate] = useState<string>('');
    const isProcessing = useSharedValue(false); // KEEP FOR STABILITY

    // MoveNet model input sizes (confirmed by local TFLite inspection)
    const modelInputSize = useSharedValue(256);
    const frameCount = useSharedValue(0);
    const [isWarmingUp, setIsWarmingUp] = useState(true);
    const WARMUP_FRAMES = 30;

    // Dynamic Cropping State (Shared Value for Worklet)
    // We store the raw outputs from the previous frame to calculate the next crop
    const previousKeypoints = useSharedValue<any[] | null>(null);
    const currentCropRegion = useSharedValue<CropRegion | null>(null);

    // Warmup Timeout Failsafe
    useEffect(() => {
        if (!isWarmingUp) return;

        const timeout = setTimeout(() => {
            console.warn('[Warmup] Timeout reached (5s). Forcing dismiss.');
            setIsWarmingUp(false);
        }, 5000);

        return () => clearTimeout(timeout);
    }, [isWarmingUp]);

    const targetFps = useMemo(() => {
        return modelType === 'movenet_lightning' ? 15 : 5;
    }, [modelType]);

    useEffect(() => {
        modelInputSize.value = modelType === 'movenet_lightning' ? 192 : 256;
    }, [modelType, modelInputSize]);

    const lastLoggedRepCountRef = React.useRef<number>(0);

    useEffect(() => {
        // Log only when reps increase (useful for logcat verification)
        if (repCount > lastLoggedRepCountRef.current) {
            console.log(`[Reps] ${lastLoggedRepCountRef.current} -> ${repCount}`);
            lastLoggedRepCountRef.current = repCount;
        }
    }, [repCount]);

    const updateReps = (output: any, timeTaken: number, timestampMs: number) => {
        try {
            const pose = poseDetectionService.processOutput(output);

            if (!repCounter.current) {
                setDebugLog("RepCounter null");
                return;
            }

            const result = repCounter.current.update(pose, timestampMs);

            const {
                count = 0,
                state = ExerciseState.UP,
                angle = 0,
                isDetected: detected = false
            } = result || {};

            // Batch all state updates together to reduce re-renders
            setDetectedKeypoints(pose.keypoints);
            setRepCount(count);
            setExerciseState(state);
            setDebugAngle(Math.round(angle));
            setAvgScore(pose.score);
            setIsDetected(detected);
            setLastInferenceTime(timeTaken);
        } catch (e: any) {
            setDebugLog("Err: " + e.message);
            console.error(e);
        }
    };

    const updateRepsWorklet = Worklets.createRunOnJS(updateReps);

    const updateFrameInfo = useCallback((
        width: number,
        height: number,
        crop: { x: number; y: number; width: number; height: number },
        orientation: 'portrait' | 'portrait-upside-down' | 'landscape-left' | 'landscape-right',
        mirrored: boolean,
        warmingUp: boolean
    ) => {
        setFrameDimensions({ width, height });
        setCropRegion(crop);
        setFrameOrientation(orientation);
        setIsFrameMirrored(mirrored);
        setIsWarmingUp(warmingUp);
    }, []);

    const updateFrameInfoWorklet = Worklets.createRunOnJS(updateFrameInfo);

    useEffect(() => {
        const init = async () => {
            if (!hasPermission) {
                await requestPermission();
            }
            try {
                const force = (delegate === 'cpu' || delegate === 'gpu' || delegate === 'nnapi') ? delegate : undefined;
                await poseDetectionService.loadModel('movenet_thunder', force);

                // Diagnostic Log
                console.log('[ModelLoad] Success', {
                    delegate: poseDetectionService.model?.delegate,
                    ready: true
                });

                setActiveDelegate(poseDetectionService.model?.delegate ?? '');
                setIsModelReady(true);
            } catch (e: any) {
                console.error("Failed to load model", e);
                setModelError(e.message || "Init Load Failed");
            }
        };
        init();
    }, [delegate, hasPermission, requestPermission]);

    const toggleModel = async () => {
        const newType = modelType === 'movenet_thunder' ? 'movenet_lightning' : 'movenet_thunder';
        console.log("Switching to " + newType);
        setIsModelReady(false);
        setModelError(null);
        setDebugLog("Loading " + newType);
        try {
            const force = (delegate === 'cpu' || delegate === 'gpu' || delegate === 'nnapi') ? delegate : undefined;
            await poseDetectionService.loadModel(newType, force);
            setModelType(newType);
            setActiveDelegate(poseDetectionService.model?.delegate ?? '');
            setIsModelReady(true);
            setDebugLog("Loaded " + newType);
        } catch (e: any) {
            setDebugLog("Fail load " + newType);
            setModelError(e.message || "Switch Failed");
        }
    };

    const toggleDelegate = () => {
        setDelegate(prev => {
            const order: DelegatePref[] = ['best', 'nnapi', 'gpu', 'cpu'];
            const idx = order.indexOf(prev);
            return order[(idx + 1) % order.length] ?? 'best';
        });
    };

    const model = poseDetectionService.model;

    const frameProcessor = useFrameProcessor((frame) => {
        'worklet';

        if (model == null || !isAIActive) return; // SKIP IF AI IS DISABLED

        runAtTargetFps(targetFps, () => {
            'worklet';
            try {
                // Prevent overlapping frames (re-entrancy crash)
                if (isProcessing.value) return;
                isProcessing.value = true;

                frameCount.value++;
                const isWarmup = frameCount.value <= WARMUP_FRAMES;

                const start = performance.now();

                // 1. Calculate Crop Region based on previous frame's keypoints
                const crop = determineCropRegion(
                    previousKeypoints.value,
                    frame.width,
                    frame.height,
                    currentCropRegion.value
                );

                // Update shared value for next frame
                currentCropRegion.value = crop;

                // Log every 10 frames during warmup to verify liveness
                if (frameCount.value % 10 === 0 && isWarmup) {
                    console.log(`[FrameProcessor] Warmup frame ${frameCount.value}/${WARMUP_FRAMES}`);
                }

                updateFrameInfoWorklet(
                    frame.width,
                    frame.height,
                    crop,
                    frame.orientation,
                    frame.isMirrored,
                    isWarmup
                );

                if (isWarmup) return; // Skip inference during warmup

                const resized = resize(frame, {
                    scale: {
                        width: modelInputSize.value,
                        height: modelInputSize.value,
                    },
                    crop: {
                        x: crop.x,
                        y: crop.y,
                        width: crop.width,
                        height: crop.height
                    },
                    pixelFormat: 'rgb',
                    dataType: 'uint8',
                });

                // 2. Inference
                const outputs = model.runSync([resized]);
                const output = outputs[0];

                // 3. Store raw keypoints (normalized) for next frame's crop calculation
                // Need to parse output efficiently. MoveNet output is [1, 1, 17, 3] or flat 51 floats.
                // We need to extract them for the next crop calculation.
                // Note: parsing here in worklet avoids JS thread roundtrip for crop logic.
                const keypoints = [];
                for (let i = 0; i < 17; i++) {
                    keypoints.push({
                        y: output[i * 3],
                        x: output[i * 3 + 1],
                        score: output[i * 3 + 2]
                    });
                }
                previousKeypoints.value = keypoints;


                const end = performance.now();
                const timeTaken = end - start;

                // Frame timestamp in milliseconds (frame.timestamp is usually nanoseconds)
                const timestampMs = frame.timestamp / 1e6;

                updateRepsWorklet(output, timeTaken, timestampMs);
            } catch (e: any) {
                // Pass error back to JS thread if possible
                console.error(`[FrameProcessor] Error: ${e.message}`);
            } finally {
                isProcessing.value = false;
            }
        });

    }, [model, updateRepsWorklet, targetFps]);

    const toggleCamera = () => {
        setCameraPosition(p => p === 'back' ? 'front' : 'back');
    };

    const cyclePhysicalDevice = () => {
        // Front cameras generally don't expose wide/ultra/tele types.
        if (cameraPosition !== 'back') {
            setPhysicalDevice('auto');
            return;
        }
        setPhysicalDevice((prev) => {
            const order: Array<PhysicalCameraDeviceType | 'auto'> = [
                'auto',
                'wide-angle-camera',
                'ultra-wide-angle-camera',
                'telephoto-camera',
            ];
            const idx = order.indexOf(prev);
            return order[(idx + 1) % order.length] ?? 'auto';
        });
    };

    useEffect(() => {
        if (!device) return;
        const backCount = allDevices.filter(d => d.position === 'back').length;
        const frontCount = allDevices.filter(d => d.position === 'front').length;
        const fmt = format ?? device.formats?.[0];

        console.log('[Camera] devices', {
            backCount,
            frontCount,
            total: allDevices.length,
        });
        console.log('[Camera] active device', {
            id: device.id,
            name: device.name,
            position: device.position,
            physicalDevices: device.physicalDevices,
            isMultiCam: device.isMultiCam,
            hardwareLevel: device.hardwareLevel,
            sensorOrientation: device.sensorOrientation,
            minZoom: device.minZoom,
            neutralZoom: device.neutralZoom,
            maxZoom: device.maxZoom,
            format: fmt
                ? {
                    videoWidth: fmt.videoWidth,
                    videoHeight: fmt.videoHeight,
                    minFps: fmt.minFps,
                    maxFps: fmt.maxFps,
                    fieldOfView: fmt.fieldOfView,
                }
                : undefined,
        });
    }, [allDevices, device, format]);


    // ... (lines 270-280)
    // Skia Renderer Component
    const SkeletonOverlay = React.memo(() => {
        // Safety check: ensure we have valid data before rendering
        if (!detectedKeypoints || detectedKeypoints.length === 0) {
            return null;
        }

        // Use screen dimensions as fallback if frame dimensions aren't set yet
        const frameW = frameDimensions.width || screenWidth;
        const frameH = frameDimensions.height || screenHeight;

        const points = useMemo(() => {
            const hasCrop = cropRegion.width > 0 && cropRegion.height > 0;
            return detectedKeypoints.map((kp) => {
                try {
                    if (hasCrop) {
                        return mapModelToScreenWithCrop(
                            kp.x,
                            kp.y,
                            cropRegion,
                            frameW,
                            frameH,
                            screenWidth,
                            screenHeight,
                            frameOrientation,
                            isFrameMirrored
                        );
                    }
                    return mapModelToScreen(kp.x, kp.y, frameW, frameH, screenWidth, screenHeight, frameOrientation, isFrameMirrored);
                } catch (e) {
                    console.warn('Coordinate mapping failed for keypoint:', kp);
                    return { x: kp.x * screenWidth, y: kp.y * screenHeight };
                }
            });
        }, [detectedKeypoints, cropRegion, frameW, frameH, screenWidth, screenHeight, frameOrientation, isFrameMirrored]);

        const roiRect = useMemo(() => {
            if (cropRegion.width === 0 || cropRegion.height === 0) return null;
            if (frameW === 0 || frameH === 0) return null;

            const topLeft = mapCameraPointToScreen(
                cropRegion.x,
                cropRegion.y,
                frameW,
                frameH,
                screenWidth,
                screenHeight,
                frameOrientation,
                isFrameMirrored
            );
            const bottomRight = mapCameraPointToScreen(
                cropRegion.x + cropRegion.width,
                cropRegion.y + cropRegion.height,
                frameW,
                frameH,
                screenWidth,
                screenHeight,
                frameOrientation,
                isFrameMirrored
            );

            const left = Math.min(topLeft.x, bottomRight.x);
            const top = Math.min(topLeft.y, bottomRight.y);
            const width = Math.abs(bottomRight.x - topLeft.x);
            const height = Math.abs(bottomRight.y - topLeft.y);

            return Skia.XYWHRect(left, top, width, height);
        }, [cropRegion, frameW, frameH, screenWidth, screenHeight, frameOrientation, isFrameMirrored]);

        const labelFont = useMemo(() => {
            const typefaceFactory = (Skia as any).Typeface;
            const typeface = typefaceFactory?.MakeFromName?.('sans-serif', 0) ?? typefaceFactory?.MakeDefault?.();
            return typeface ? Skia.Font(typeface, 12) : null;
        }, []);

        return (
            <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
                {/* Draw ROI Box - The "Active Zone" */}
                {roiRect && (
                    <Rect
                        rect={roiRect}
                        color="rgba(255, 255, 255, 0.2)"
                        style="stroke"
                        strokeWidth={2}
                    />
                )}

                {/* Draw Lines - FORCE RENDER ALL */}
                {KEYPOINT_PAIRS.map(([start, end], index) => {
                    const p1 = points[start];
                    const p2 = points[end];
                    const s1 = detectedKeypoints[start]?.score ?? 0;
                    const s2 = detectedKeypoints[end]?.score ?? 0;

                    // Skip if points are invalid
                    if (!p1 || !p2) return null;

                    return (
                        <Line
                            key={`line-${index}`}
                            p1={Skia.Point(p1.x, p1.y)}
                            p2={Skia.Point(p2.x, p2.y)}
                            color={(s1 > 0.3 && s2 > 0.3) ? "#CCFF00" : "rgba(255, 0, 0, 0.5)"} // Green if good, Red if bad
                            style="stroke"
                            strokeWidth={3}
                        />
                    );
                })}

                {/* Draw Joints - FORCE RENDER ALL */}
                {points.map((p, i) => {
                    if (!p) return null;
                    const score = detectedKeypoints[i]?.score ?? 0;
                    return (
                        <Circle
                            key={`joint-${i}`}
                            cx={p.x}
                            cy={p.y}
                            r={5}
                            color={score > 0.3 ? "#00FF00" : "red"}
                        />
                    );
                })}

                {/* Draw Joint Index Labels (MoveNet indices 0-16) */}
                {labelFont && points.map((p, i) => {
                    if (!p) return null;
                    return (
                        <SkiaText
                            key={`label-${i}`}
                            x={p.x + 6}
                            y={p.y - 6}
                            text={`${i}:${KEYPOINT_LABELS[i] ?? ''}`}
                            color="#FFFFFF"
                            font={labelFont}
                        />
                    );
                })}
            </Canvas>
        );
    });

    if (!hasPermission) return <View style={styles.center}><Text style={styles.text}>No Camera Permission</Text></View>;
    if (device == null) return <View style={styles.center}><Text style={styles.text}>No Device Found</Text></View>;
    if (modelError) return <View style={styles.center}><Text style={[styles.text, { color: 'red', textAlign: 'center', margin: 20 }]}>Error: {modelError}</Text></View>;
    if (!isModelReady) return <View style={styles.center}><ActivityIndicator size="large" color="#CCFF00" /><Text style={styles.text}>Loading AI...</Text></View>;
    if (isWarmingUp) return (
        <View style={styles.container}>
            <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={true}
                frameProcessor={frameProcessor}
                pixelFormat="yuv"
                format={format}
                resizeMode="cover"
            />
            <View style={[styles.center, { backgroundColor: 'transparent', position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }]}>
                <ActivityIndicator size="large" color="#CCFF00" />
                <Text style={[styles.text, { fontWeight: 'bold' }]}>Warming Up Model...</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={true}
                frameProcessor={frameProcessor}
                pixelFormat="yuv"
                format={format}
                resizeMode="cover" // Explicitly ensure cover mode
            />

            <SkeletonOverlay />

            <View style={styles.uiContainer}>
                <TouchableOpacity onPress={toggleCamera} style={styles.iconButton}>
                    <Ionicons name="camera-reverse" size={30} color="white" />
                </TouchableOpacity>

                <TouchableOpacity onPress={cyclePhysicalDevice} style={[styles.iconButton, { marginTop: 10 }]}>
                    <Ionicons name="aperture-outline" size={30} color="white" />
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleModel} style={[styles.iconButton, { marginTop: 10 }]}>
                    <Ionicons name="hardware-chip-outline" size={30} color={modelType === 'movenet_thunder' ? '#CCFF00' : 'white'} />
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleDelegate} style={[styles.iconButton, { marginTop: 10 }]}>
                    <Ionicons name="speedometer-outline" size={30} color="white" />
                </TouchableOpacity>

                <View style={styles.debugBadge}>
                    <Text style={styles.debugTextSmall}>Model: {modelType === 'movenet_thunder' ? 'Thunder' : 'Lightning'}</Text>
                    <Text style={styles.debugTextSmall}>Delegate: {activeDelegate || delegate}</Text>
                    <Text style={styles.debugTextSmall}>Cam: {device.name}</Text>
                    <Text style={styles.debugTextSmall}>Lens: {physicalDevice}</Text>
                    <Text style={styles.debugTextSmall}>Phys: {device.physicalDevices.join('+')}</Text>
                    <Text style={styles.debugTextSmall}>FOV: {(format?.fieldOfView ?? device.formats?.[0]?.fieldOfView ?? 0).toFixed(0)}°</Text>
                    <Text style={styles.debugTextSmall}>T: {Math.round(lastInferenceTime)}ms</Text>
                    <Text style={styles.debugTextSmall}>Conf: {(avgScore * 100).toFixed(0)}%</Text>
                    <Text style={styles.debugTextSmall}>S: {exerciseState}</Text>
                    <Text style={styles.debugTextSmall}>Kpts: {detectedKeypoints.length}</Text>
                    {!isDetected && <Text style={{ color: 'red', fontWeight: 'bold', fontSize: 10 }}>TRACKING LOST</Text>}
                </View>
            </View>

            <View style={styles.overlay}>
                <Text style={styles.debugTextSmall}>{debugLog}</Text>
                <Text style={styles.repText}>{repCount}</Text>
                <Text style={styles.label}>SQUATS</Text>
                <View style={styles.divider} />
                <Text style={styles.debugText}>{exerciseState}</Text>
                <Text style={styles.debugText}>{debugAngle}°</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    text: {
        color: 'white',
        marginTop: 10,
    },
    uiContainer: {
        position: 'absolute',
        top: 50,
        right: 20,
        alignItems: 'flex-end',
        gap: 10,
        zIndex: 10,
    },
    iconButton: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
        borderRadius: 25,
    },
    detectedBadge: {
        backgroundColor: '#CCFF00',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
        marginTop: 10,
    },
    detectedText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 12,
    },
    debugBadge: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 5,
        borderRadius: 5,
        marginTop: 10,
    },
    debugTextSmall: {
        color: '#00FF00',
        fontSize: 10,
        fontFamily: 'monospace',
    },
    overlay: {
        position: 'absolute',
        top: 50,
        left: 20,
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 8,
        zIndex: 10,
    },
    debugText: {
        color: '#CCFF00',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    repText: {
        color: '#CCFF00',
        fontSize: 48,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    label: {
        color: 'white',
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 5,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginVertical: 5,
    }
});
