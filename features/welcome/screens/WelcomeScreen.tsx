import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Assets
const welcomeBg = require('@assets/images/welcome-bg-dynamic.jpg');

const { width, height } = Dimensions.get('window');

export const WelcomeScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Animation values for Ken Burns background effect
    const scale = useSharedValue(1);
    const translateY = useSharedValue(0);

    useEffect(() => {
        // Ken Burns effect on background
        scale.value = withRepeat(
            withTiming(1.15, { duration: 15000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true,
        );
        translateY.value = withRepeat(
            withSequence(
                withTiming(-20, { duration: 15000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 15000, easing: Easing.inOut(Easing.ease) }),
            ),
            -1,
            true,
        );
    }, []);

    const animatedImageStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }, { translateY: translateY.value }],
    }));

    const handleGetStarted = () => {
        router.push('/(auth)/signup');
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Animated Background */}
            <View style={styles.imageContainer}>
                <Animated.Image
                    source={welcomeBg}
                    style={[styles.backgroundImage, animatedImageStyle]}
                    resizeMode="cover"
                />
                <View style={styles.overlay} />
            </View>

            <View style={[styles.contentContainer, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}>

                {/* Brand / Hero */}
                <Animated.View
                    style={styles.topSection}
                    entering={FadeIn.duration(800)}
                >
                    <View style={styles.logoRowOuter}>
                        <Text style={styles.logoText}>L</Text>
                        <View style={styles.logoBox}>
                            <Text style={styles.logoText}>E</Text>
                            <Text style={[styles.logoText, styles.greenLogoText]}>V</Text>
                            <Text style={[styles.logoText, styles.invertedL]}>E</Text>
                        </View>
                        <Text style={[styles.logoText, styles.invertedL]}>L</Text>
                    </View>
                    <Animated.Text
                        entering={FadeIn.delay(400).duration(800)}
                        style={styles.tagline}
                    >
                        ELEVATE YOUR FORM.
                    </Animated.Text>
                </Animated.View>

                {/* Action Area */}
                <Animated.View
                    style={styles.bottomSection}
                    entering={FadeIn.delay(600).duration(800)}
                >
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleGetStarted}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.buttonText}>START TRAINING</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, { marginTop: 10, backgroundColor: '#333' }]}
                        onPress={() => router.push('/vision-test')}
                    >
                        <Text style={styles.buttonText}>TEST VISION ENGINE</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, { marginTop: 10, backgroundColor: '#444' }]}
                        onPress={() => router.push('/benchmark')}
                    >
                        <Text style={styles.buttonText}>BENCHMARK ENGINE</Text>
                    </TouchableOpacity>

                    <View style={styles.loginRow}>
                        <Text style={styles.loginText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                            <Text style={styles.loginLink}>Log In</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.version}>v1.1.0 (Reborn)</Text>
                </Animated.View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    imageContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    backgroundImage: {
        width: width,
        height: height,
        position: 'absolute',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(5, 5, 5, 0.45)',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 24,
    },
    topSection: {
        alignItems: 'center',
        marginTop: 60,
    },
    logoRowOuter: {
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    logoBox: {
        borderWidth: 4,
        borderColor: '#FFFFFF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 4,
        gap: 4,
    },
    logoText: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 48,
        lineHeight: 52,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    invertedL: {
        transform: [{ scaleX: -1 }],
    },
    greenLogoText: {
        color: '#CCFF00', // VOLT
    },
    tagline: {
        color: '#CCFF00', // VOLT
        fontSize: 14,
        letterSpacing: 4,
        fontWeight: 'bold',
        textAlign: 'center',
        textShadowColor: 'rgba(204, 255, 0, 0.5)',
        textShadowRadius: 10,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    bottomSection: {
        gap: 24,
        width: '100%',
        alignItems: 'center',
    },
    button: {
        backgroundColor: '#CCFF00',
        height: 56,
        borderRadius: 30,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#000000',
        fontSize: 16,
        fontFamily: 'SpaceGrotesk_700Bold',
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    loginRow: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    loginText: {
        color: '#A0A0A0',
        fontSize: 14,
        fontFamily: 'SpaceGrotesk_500Medium',
    },
    loginLink: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'SpaceGrotesk_700Bold',
        textDecorationLine: 'underline',
    },
    version: {
        textAlign: 'center',
        color: '#525252',
        opacity: 0.5,
        fontSize: 12,
    },
});
