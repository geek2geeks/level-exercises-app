import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import { Pose } from '../../types/vision';

export type ModelType = 'movenet_thunder' | 'movenet_lightning';

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

    async loadModel(type: ModelType = 'movenet_thunder'): Promise<void> {
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

            // Try to load with NNAPI (Android NPU) first, then GPU, then CPU
            try {
                console.log("Attempting to load with NNAPI delegate...");
                this._model = await loadTensorflowModel(modelAsset, 'nnapi');
            } catch (nnapiError) {
                console.warn("NNAPI failed, trying GPU...", nnapiError);
                try {
                    this._model = await loadTensorflowModel(modelAsset, 'android-gpu');
                } catch (gpuError) {
                    console.warn("GPU failed, falling back to CPU...", gpuError);
                    this._model = await loadTensorflowModel(modelAsset);
                }
            }

            this._currentType = type;

            console.log(`${type} loaded successfully. Delegate: ${this._model.delegate}`);
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
