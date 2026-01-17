import React, { useEffect } from "react";
import { Text, TextStyle, View, ViewStyle } from "react-native";
import Animated, {
    Easing,
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming
} from "react-native-reanimated";

// Logo is vertically centered to match native splash screen

const colors = {
    palette: {
        neutral100: "#FFFFFF",
        primary500: "#CCFF00",
    }
}

const ANI_DURATION = 1600;
const INITIAL_DELAY = 300; // Reduced from 500ms for snappier feel
const MORPH_EASING = Easing.bezier(0.25, 0.8, 0.25, 1);

export const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
    const progress = useSharedValue(0);
    const fadeOut = useSharedValue(1);

    useEffect(() => {
        // Sequence:
        // 1. Brief pause (300ms) - static "V" box visible
        // 2. Animate LEVEL expansion (1.6s)
        // 3. Quick fade out (200ms) - Welcome screen already positioned behind

        progress.value = withDelay(INITIAL_DELAY, withTiming(1, {
            duration: ANI_DURATION,
            easing: MORPH_EASING
        }, (finished) => {
            if (finished) {
                // Immediate transition - no extra delay
                fadeOut.value = withTiming(0, { duration: 200 }, (f) => {
                    if (f) runOnJS(onFinish)();
                });
            }
        }));
    }, []);

    // Box expands from 50px (just V) to ~110px (E V E with tight padding)
    const $boxStyle = useAnimatedStyle(() => ({
        width: interpolate(progress.value, [0, 1], [50, 110]),
        borderColor: colors.palette.neutral100,
    }));

    // E letters slide out from behind V
    const $eLeftStyle = useAnimatedStyle(() => ({
        opacity: interpolate(progress.value, [0, 0.3], [0, 1], Extrapolation.CLAMP),
        transform: [{
            translateX: interpolate(progress.value, [0, 1], [15, 0], Extrapolation.CLAMP),
        }],
    }));

    const $eRightStyle = useAnimatedStyle(() => ({
        opacity: interpolate(progress.value, [0, 0.3], [0, 1], Extrapolation.CLAMP),
        transform: [
            { scaleX: -1 },
            { translateX: interpolate(progress.value, [0, 1], [15, 0], Extrapolation.CLAMP) }
        ],
    }));

    // L letters slide in from outside
    const $lLeftStyle = useAnimatedStyle(() => ({
        opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
        transform: [{
            translateX: interpolate(progress.value, [0, 1], [20, 0], Extrapolation.CLAMP),
        }],
    }));

    const $lRightStyle = useAnimatedStyle(() => ({
        opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
        transform: [
            { scaleX: -1 },
            { translateX: interpolate(progress.value, [0, 1], [20, 0], Extrapolation.CLAMP) }
        ],
    }));

    // Tagline fades in after expansion
    const $taglineStyle = useAnimatedStyle(() => ({
        opacity: interpolate(progress.value, [0.7, 1], [0, 1], Extrapolation.CLAMP),
    }));

    // Entire splash fades out at the end
    const $containerStyle = useAnimatedStyle(() => ({
        opacity: fadeOut.value,
    }));

    return (
        <Animated.View style={[$container, $containerStyle]}>
            <View style={$contentContainer}>
                <View style={$logoRow}>
                    {/* Left L */}
                    <Animated.Text style={[$logoText, $lLeftStyle]}>L</Animated.Text>

                    {/* Box [ E V E ] */}
                    <Animated.View style={[$logoBox, $boxStyle]}>
                        <Animated.Text style={[$logoText, $eLeftStyle]}>E</Animated.Text>
                        <Text style={[$logoText, $greenLogoText]}>V</Text>
                        <Animated.Text style={[$logoText, $eRightStyle]}>E</Animated.Text>
                    </Animated.View>

                    {/* Right L */}
                    <Animated.Text style={[$logoText, $invertedL, $lRightStyle]}>L</Animated.Text>
                </View>

                <Animated.Text style={[$tagline, $taglineStyle]}>ELEVATE YOUR FORM.</Animated.Text>
            </View>
        </Animated.View>
    )
}

const $container: ViewStyle = {
    ...require('react-native').StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    zIndex: 100, // Ensure splash is on top
}

const $contentContainer: ViewStyle = {
    flex: 1,
    alignItems: "center",
    justifyContent: "center", // Vertically centered to match native splash
}

const $logoRow: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
}

const $logoBox: ViewStyle = {
    height: 64,
    borderWidth: 4,
    borderColor: colors.palette.neutral100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
}

const $logoText: TextStyle = {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 48,
    lineHeight: 52,
    fontWeight: "900",
    color: colors.palette.neutral100,
    includeFontPadding: false,
    textAlignVertical: "center",
}

const $greenLogoText: TextStyle = {
    color: colors.palette.primary500,
    zIndex: 10,
}

const $invertedL: TextStyle = {
    // transform handled in animated style
}

const $tagline: TextStyle = {
    color: colors.palette.primary500,
    fontSize: 14,
    letterSpacing: 4,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 24,
    textShadowColor: "rgba(204, 255, 0, 0.5)",
    textShadowRadius: 10,
    fontFamily: "SpaceGrotesk_700Bold",
}
