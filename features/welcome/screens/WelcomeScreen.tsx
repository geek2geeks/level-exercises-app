import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const WelcomeScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

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

    const handleAppleSignIn = async () => {
        setLoadingProvider('apple');
        // TODO: Implement Apple Sign-In
        setTimeout(() => {
            setLoadingProvider(null);
            router.push('/(auth)/signup');
        }, 500);
    };

    const handleGoogleSignIn = async () => {
        setLoadingProvider('google');
        // TODO: Implement Google Sign-In
        setTimeout(() => {
            setLoadingProvider(null);
            router.push('/(auth)/signup');
        }, 500);
    };

    const handleEmailSignIn = () => {
        router.push('/(auth)/login');
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Animated Background - fades in after splash */}
            <Animated.View
                style={styles.imageContainer}
                entering={FadeIn.duration(600)}
            >
                <Animated.Image
                    source={welcomeBg}
                    style={[styles.backgroundImage, animatedImageStyle]}
                    resizeMode="cover"
                />
                <View style={styles.overlay} />
            </Animated.View>

            {/* Logo Section - CENTERED to match SplashScreen */}
            <View style={styles.logoSection}>
                <View style={styles.logoRowOuter}>
                    <Text style={styles.logoText}>L</Text>
                    <View style={styles.logoBox}>
                        <Text style={styles.logoText}>E</Text>
                        <Text style={[styles.logoText, styles.greenLogoText]}>V</Text>
                        <Text style={[styles.logoText, styles.invertedL]}>E</Text>
                    </View>
                    <Text style={[styles.logoText, styles.invertedL]}>L</Text>
                </View>
                <Text style={styles.tagline}>ELEVATE YOUR FORM.</Text>
            </View>

            {/* Auth Buttons - fade in at bottom */}
            <Animated.View
                style={[styles.bottomSection, { paddingBottom: insets.bottom + 40 }]}
                entering={FadeIn.delay(200).duration(800)}
            >
                {/* Apple Sign-In (Primary) */}
                <TouchableOpacity
                    style={styles.appleButton}
                    onPress={handleAppleSignIn}
                    activeOpacity={0.9}
                    disabled={loadingProvider !== null}
                >
                    {loadingProvider === 'apple' ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <>
                            <Text style={styles.appleIcon}></Text>
                            <Text style={styles.appleButtonText}>Continue with Apple</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Google Sign-In */}
                <TouchableOpacity
                    style={styles.googleButton}
                    onPress={handleGoogleSignIn}
                    activeOpacity={0.9}
                    disabled={loadingProvider !== null}
                >
                    {loadingProvider === 'google' ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Text style={styles.googleIcon}>G</Text>
                            <Text style={styles.googleButtonText}>Continue with Google</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Email Sign-In Link */}
                <TouchableOpacity
                    style={styles.emailLink}
                    onPress={handleEmailSignIn}
                >
                    <Text style={styles.emailLinkText}>Sign in with Email</Text>
                </TouchableOpacity>

                <Text style={styles.version}>v1.1.0 (Reborn)</Text>
            </Animated.View>
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
        height: SCREEN_HEIGHT,
        position: 'absolute',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(5, 5, 5, 0.55)',
    },
    // Logo section - vertically centered to match splash
    logoSection: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoRowOuter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    logoBox: {
        height: 64,
        paddingHorizontal: 6, // Tight fit around EVE
        borderWidth: 4,
        borderColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoText: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 48,
        lineHeight: 52,
        fontWeight: '900',
        color: '#FFFFFF',
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
    invertedL: {
        transform: [{ scaleX: -1 }],
    },
    greenLogoText: {
        color: '#CCFF00',
    },
    tagline: {
        color: '#CCFF00',
        fontSize: 14,
        letterSpacing: 4,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 24,
        textShadowColor: 'rgba(204, 255, 0, 0.5)',
        textShadowRadius: 10,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    // Bottom auth section
    bottomSection: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        gap: 14,
        alignItems: 'center',
    },
    // Apple Button - White background (primary)
    appleButton: {
        backgroundColor: '#FFFFFF',
        height: 56,
        borderRadius: 28,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    appleIcon: {
        fontSize: 20,
        color: '#000000',
    },
    appleButtonText: {
        color: '#000000',
        fontSize: 16,
        fontFamily: 'SpaceGrotesk_700Bold',
        fontWeight: 'bold',
    },
    // Google Button - Dark with border
    googleButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        height: 56,
        borderRadius: 28,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    googleIcon: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    googleButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'SpaceGrotesk_700Bold',
        fontWeight: 'bold',
    },
    // Email link
    emailLink: {
        marginTop: 4,
        paddingVertical: 12,
    },
    emailLinkText: {
        color: '#A0A0A0',
        fontSize: 14,
        fontFamily: 'SpaceGrotesk_500Medium',
        textDecorationLine: 'underline',
    },
    version: {
        textAlign: 'center',
        color: '#525252',
        opacity: 0.5,
        fontSize: 12,
        marginTop: 4,
    },
});
