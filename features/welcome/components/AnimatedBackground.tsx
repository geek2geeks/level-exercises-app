import { Canvas, Rect, SweepGradient, vec } from '@shopify/react-native-skia';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const centerX = width / 2;
const centerY = height / 2;

export const AnimatedBackground = () => {
    const rotation = useSharedValue(0);

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(360, { duration: 20000, easing: Easing.linear }),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.canvasContainer, animatedStyle]}>
                <Canvas style={{ flex: 1 }}>
                    <Rect x={-width} y={-height} width={width * 3} height={height * 3}>
                        <SweepGradient
                            c={vec(centerX, centerY)}
                            colors={['#1a1a1a', '#222222', '#121212', '#1a1a1a']}
                            start={0}
                            end={360}
                            origin={vec(centerX, centerY)}
                        />
                    </Rect>
                </Canvas>
            </Animated.View>
            <View style={styles.overlay} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#121212',
        overflow: 'hidden',
    },
    canvasContainer: {
        width: width * 3, // Make it big enough to cover corners when rotating
        height: height * 3,
        position: 'absolute',
        left: -width,
        top: -height,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)', // Darken slightly
    },
});
