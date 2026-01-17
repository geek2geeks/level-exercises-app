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
                            <Text style={styles.appleIcon}></Text>
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
        paddingHorizontal: 28,
        gap: 12,
        alignItems: 'center',
    },
    // Apple Button - Premium white with shadow
    appleButton: {
        backgroundColor: '#FFFFFF',
        height: 54,
        borderRadius: 27,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        // Shadow for premium feel
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    appleIcon: {
        fontSize: 18,
        color: '#000000',
        marginTop: -2, // Optical alignment
    },
    appleButtonText: {
        color: '#000000',
        fontSize: 15,
        fontFamily: 'SpaceGrotesk_700Bold',
        fontWeight: 'bold',
        letterSpacing: 0.3,
    },
    // Google Button - Glassmorphism effect
    googleButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        height: 54,
        borderRadius: 27,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    googleIcon: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#EA4335', // Google Red
    },
    googleButtonText: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 15,
        fontFamily: 'SpaceGrotesk_600SemiBold',
        letterSpacing: 0.3,
    },
    // Email link - More visible
    emailLink: {
        marginTop: 8,
        paddingVertical: 14,
        paddingHorizontal: 20,
    },
    emailLinkText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
        fontFamily: 'SpaceGrotesk_500Medium',
        letterSpacing: 0.5,
    },
    version: {
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.25)',
        fontSize: 11,
        marginTop: 8,
        letterSpacing: 0.5,
    },
});
