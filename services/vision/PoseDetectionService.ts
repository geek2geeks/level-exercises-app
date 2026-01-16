import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import { Pose } from '../../types/vision';
import { getDeviceCapabilities } from './DeviceCapabilities';

export type ModelType = 'movenet_thunder' | 'movenet_lightning';

export type ExerciseType = 'squat' | 'pushup' | 'lunge' | 'plank' | 'complex';

const EXERCISE_MODEL_MAP: Record<ExerciseType, ModelType> = {
    squat: 'movenet_lightning',    // Joint angles only, fast
    pushup: 'movenet_lightning',   // Joint angles only, fast
    lunge: 'movenet_lightning',    // Joint angles only, fast
    plank: 'movenet_thunder',      // Needs full body precision
    complex: 'movenet_thunder',    // Yoga, etc.
};

class PoseDetectionService {
    private _model: TensorflowModel | null = null;
    private _currentType: ModelType = 'movenet_thunder';
    private _isReady: boolean = false;

    get model(): TensorflowModel | null {
        return this._model;
    }

    get isReady(): boolean {
        return this._isReady;
    }

    get currentType(): ModelType {
        return this._currentType;
    }

    getRecommendedModel(exercise: ExerciseType): ModelType {
        return EXERCISE_MODEL_MAP[exercise] ?? 'movenet_lightning';
    }

    async loadModel(type: ModelType = 'movenet_thunder', forceDelegate?: 'nnapi' | 'gpu' | 'cpu'): Promise<void> {
        try {
            console.log(`Loading model: ${type}...`);
            this._isReady = false;

            let modelAsset;
            if (type === 'movenet_thunder') {
                modelAsset = require('@assets/models/movenet_thunder_int8.tflite');
            } else if (type === 'movenet_lightning') {
                modelAsset = require('@assets/models/movenet_lightning_int8.tflite');
            } else {
                throw new Error(`Unknown model type: ${type}`);
            }

            // 1. Check Capabilities
            const caps = await getDeviceCapabilities();
            console.log(`[PoseService] Device Caps: API=${caps.androidApiLevel} GPU=${caps.supportsGpu} NNAPI=${caps.supportsNnapi} Rec=${caps.recommendedDelegate}`);

            const startTime = performance.now();
            let usedDelegate = 'cpu';

            // 2. Try to load with forced delegate or intelligent sequence
            try {
                if (forceDelegate) {
                    const delegateMap: Record<string, any> = { 'gpu': 'android-gpu', 'nnapi': 'nnapi', 'cpu': undefined };
                    usedDelegate = forceDelegate;
                    console.log(`Forcing delegate: ${forceDelegate}`);
                    this._model = await loadTensorflowModel(modelAsset, delegateMap[forceDelegate]);
                } else {
                    // Intelligent Sequence based on Device Capabilities
                    const isIOS = require('react-native').Platform.OS === 'ios';

                    if (isIOS) {
                        if (caps.recommendedDelegate === 'core-ml') {
                            try {
                                console.log("Attempting CoreML delegate...");
                                this._model = await loadTensorflowModel(modelAsset, 'core-ml');
                                usedDelegate = 'core-ml';
                            } catch (e) {
                                console.warn("CoreML failed, fallback CPU", e);
                                this._model = await loadTensorflowModel(modelAsset);
                                usedDelegate = 'cpu';
                            }
                        } else {
                            this._model = await loadTensorflowModel(modelAsset); // Simulator or forced CPU
                            usedDelegate = 'cpu';
                        }
                    } else {
                        // Android Smart Chain
                        if (caps.supportsGpu) {
                            try {
                                console.log("Attempting GPU delegate...");
                                this._model = await loadTensorflowModel(modelAsset, 'android-gpu');
                                usedDelegate = 'android-gpu';
                            } catch (gpuErr) {
                                console.warn("GPU failed...", gpuErr);
                                if (caps.supportsNnapi) {
                                    try {
                                        console.log("Falling back to NNAPI...");
                                        this._model = await loadTensorflowModel(modelAsset, 'nnapi');
                                        usedDelegate = 'nnapi';
                                    } catch (nnapiErr) {
                                        console.warn("NNAPI failed, fallback CPU", nnapiErr);
                                        this._model = await loadTensorflowModel(modelAsset);
                                        usedDelegate = 'cpu';
                                    }
                                } else {
                                    console.log("NNAPI not supported/recommended, fallback CPU");
                                    this._model = await loadTensorflowModel(modelAsset);
                                    usedDelegate = 'cpu';
                                }
                            }
                        } else if (caps.supportsNnapi) {
                            try {
                                console.log("GPU not supported, trying NNAPI...");
                                this._model = await loadTensorflowModel(modelAsset, 'nnapi');
                                usedDelegate = 'nnapi';
                            } catch (nnapiErr) {
                                console.warn("NNAPI failed, fallback CPU", nnapiErr);
                                this._model = await loadTensorflowModel(modelAsset);
                                usedDelegate = 'cpu';
                            }
                        } else {
                            console.log("Accelerators not supported, using CPU");
                            this._model = await loadTensorflowModel(modelAsset);
                            usedDelegate = 'cpu';
                        }
                    }
                }
            } catch (error) {
                console.error("Delegate selection failed, forcing absolute fallback to CPU", error);
                this._model = await loadTensorflowModel(modelAsset);
                usedDelegate = 'cpu';
            }

            const loadTime = performance.now() - startTime;
            console.log(`${type} loaded. Delegate: ${this._model?.delegate} (Attempted: ${usedDelegate}) in ${loadTime.toFixed(0)}ms`);

            this._currentType = type;
            this._isReady = true;
        } catch (error) {
            console.error(`Failed to load ${type}:`, error);
            throw error;
        }
    }

    processOutput(output: any): Pose {
        // MoveNet Thunder/Lightning output is [1, 1, 17, 3] (y, x, score)
        // Adjust for library output which might be flat float32 array
        const rawData = output;
        const keypoints: any[] = [];
        let totalScore = 0;

        for (let i = 0; i < 17; i++) {
            const y = rawData[i * 3];
            const x = rawData[i * 3 + 1];
            const score = rawData[i * 3 + 2];

            keypoints.push({ x, y, score });
            totalScore += score;
        }

        return {
            keypoints,
            score: totalScore / 17,
        };
    }
}

export const poseDetectionService = new PoseDetectionService();
