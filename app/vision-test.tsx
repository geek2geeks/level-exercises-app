import { CameraView } from '@features/vision/components/CameraView';
import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function VisionTestScreen() {
    return (
        <View style={{ flex: 1 }}>
            <Stack.Screen options={{ title: 'Vision Test', headerShown: true }} />
            <CameraView />
        </View>
    );
}
