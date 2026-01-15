import { Ionicons } from '@expo/vector-icons';
import { ModelType, poseDetectionService } from '@services/vision/PoseDetectionService';
import { ExerciseState, RepCounter } from '@services/vision/RepCounter';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
    Camera,
    CameraPosition,
    runAtTargetFps,
    useCameraDevice,
    useCameraPermission,
    useFrameProcessor
} from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';
import { useResizePlugin } from 'vision-camera-resize-plugin';

export const CameraView = () => {
    const { hasPermission, requestPermission } = useCameraPermission();
    const [cameraPosition, setCameraPosition] = useState<CameraPosition>('back');
    const [exerciseState, setExerciseState] = useState<ExerciseState>(ExerciseState.UP);
    const [repCount, setRepCount] = useState(0);
    const [debugAngle, setDebugAngle] = useState(0);
    const device = useCameraDevice(cameraPosition);
    const { resize } = useResizePlugin();

    const [isModelReady, setIsModelReady] = useState(false);
    const [modelError, setModelError] = useState<string | null>(null);
    const [lastInferenceTime, setLastInferenceTime] = useState(0);
    const [avgScore, setAvgScore] = useState(0);
    const repCounter = React.useRef(new RepCounter());

    // Model Switching State
    const [modelType, setModelType] = useState<ModelType>('movenet_thunder');

    const [debugLog, setDebugLog] = useState("Init...");

    const updateReps = (output: any, timeTaken: number) => {
        try {
            const pose = poseDetectionService.processOutput(output);

            if (!repCounter.current) {
                setDebugLog("RepCounter null");
                return;
            }

            const result = repCounter.current.update(pose);

            const {
                count = 0,
                state = ExerciseState.UP,
                angle = 0
            } = result || {};

            setRepCount(count);
            setExerciseState(state);
            setDebugAngle(Math.round(angle));
            setAvgScore(pose.score);
            setLastInferenceTime(timeTaken);
        } catch (e: any) {
            setDebugLog("Err: " + e.message);
            console.error(e);
        }
    };

    const updateRepsWorklet = Worklets.createRunOnJS(updateReps);

    useEffect(() => {
        const init = async () => {
            if (!hasPermission) {
                await requestPermission();
            }
            try {
                // Initial load default
                await poseDetectionService.loadModel('movenet_thunder');
                setIsModelReady(true);
            } catch (e: any) {
                console.error("Failed to load model", e);
                setModelError(e.message || "Init Load Failed");
            }
        };
        init();
    }, [hasPermission]);

    const toggleModel = async () => {
        const newType = modelType === 'movenet_thunder' ? 'movenet_lightning' : 'movenet_thunder';
        console.log("Switching to " + newType);
        setIsModelReady(false);
        setModelError(null);
        setDebugLog("Loading " + newType);
        try {
            await poseDetectionService.loadModel(newType);
            setModelType(newType);
            setIsModelReady(true);
            setDebugLog("Loaded " + newType);
        } catch (e: any) {
            setDebugLog("Fail load " + newType);
            setModelError(e.message || "Switch Failed");
            // We set isModelReady true so we can render the error message VIEW or the previous model if it's still there?
            // But if loadModel failed, the service might be in inconsistent state.
            // Better to show error.
        }
    };

    const model = poseDetectionService.model;

    const frameProcessor = useFrameProcessor((frame) => {
        'worklet';

        if (model == null) return;

        runAtTargetFps(30, () => {
            'worklet';
            const start = performance.now();

            // 1. Resize Frame with Center Crop
            const size = Math.min(frame.width, frame.height);
            const x = (frame.width - size) / 2;
            const y = (frame.height - size) / 2;

            const resized = resize(frame, {
                scale: {
                    width: 256,
                    height: 256,
                },
                crop: {
                    x: x,
                    y: y,
                    width: size,
                    height: size
                },
                pixelFormat: 'rgb',
                dataType: 'uint8',
            });

            // 2. Inference
            const outputs = model.runSync([resized]);
            const output = outputs[0];

            const end = performance.now();
            const timeTaken = end - start;

            updateRepsWorklet(output, timeTaken);
        });

    }, [model, updateRepsWorklet]);

    const toggleCamera = () => {
        setCameraPosition(p => p === 'back' ? 'front' : 'back');
    };

    if (!hasPermission) return <View style={styles.center}><Text style={styles.text}>No Camera Permission</Text></View>;
    if (device == null) return <View style={styles.center}><Text style={styles.text}>No Device Found</Text></View>;
    if (modelError) return <View style={styles.center}><Text style={[styles.text, { color: 'red', textAlign: 'center', margin: 20 }]}>Error: {modelError}</Text></View>;
    if (!isModelReady) return <View style={styles.center}><ActivityIndicator size="large" color="#CCFF00" /><Text style={styles.text}>Loading AI...</Text></View>;

    return (
        <View style={styles.container}>
            <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={true}
                frameProcessor={frameProcessor}
                pixelFormat="yuv"
            />

            <View style={styles.uiContainer}>
                <TouchableOpacity onPress={toggleCamera} style={styles.iconButton}>
                    <Ionicons name="camera-reverse" size={30} color="white" />
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleModel} style={[styles.iconButton, { marginTop: 10 }]}>
                    <Ionicons name="hardware-chip-outline" size={30} color={modelType === 'movenet_thunder' ? '#CCFF00' : 'white'} />
                </TouchableOpacity>

                <View style={styles.debugBadge}>
                    <Text style={styles.debugTextSmall}>Model: {modelType === 'movenet_thunder' ? 'Thunder' : 'Lightning'}</Text>
                    <Text style={styles.debugTextSmall}>T: {Math.round(lastInferenceTime)}ms</Text>
                    <Text style={styles.debugTextSmall}>Conf: {(avgScore * 100).toFixed(0)}%</Text>
                    <Text style={styles.debugTextSmall}>S: {exerciseState}</Text>
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
