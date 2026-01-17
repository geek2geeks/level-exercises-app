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

const colors = {
    palette: {
        neutral100: "#FFFFFF",
        primary500: "#CCFF00",
    }
}

const ANI_DURATION = 1600;
const INITIAL_DELAY = 500;
const MORPH_EASING = Easing.bezier(0.25, 0.8, 0.25, 1);

export const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
    // Animation Values
    const progress = useSharedValue(0); // 0 -> 1 (Main sequence)
    const curtainOpacity = useSharedValue(1);

    useEffect(() => {
        // Sequence:
        // 1. Wait DELAY (500ms) to match native splash
        // 2. Animate Progress 0 -> 1 (1.6s) - Box Widen, E Reveal, L Slide In
        // 3. Brief hold, then immediately transition to Welcome (no fade)

        progress.value = withDelay(INITIAL_DELAY, withTiming(1, {
            duration: ANI_DURATION,
            easing: MORPH_EASING
        }, (finished) => {
            // After expansion completes, wait briefly then go to Welcome
            if (finished) {
                // Short delay for user to see the final "LEVEL" logo, then transition
                curtainOpacity.value = withDelay(800, withTiming(0, { duration: 300 }, (f) => {
                    if (f) runOnJS(onFinish)();
                }));
            }
        }));
    }, []);

    // 1. Box Widen: 50px -> 140px (Approx to fit EVE)
    const $boxStyle = useAnimatedStyle(() => ({
        width: interpolate(progress.value, [0, 1], [50, 126]), // 44->116 in HTML + padding
        // Border "Close" simulation: We can just keep border constant or animate color
        borderColor: colors.palette.neutral100,
    }));

    // 2. E Slide Out: Translate X 10 -> 0, Opacity 0 -> 1
    const $eLeftStyle = useAnimatedStyle(() => ({
        opacity: interpolate(progress.value, [0, 0.3], [0, 1], Extrapolation.CLAMP),
        transform: [{
            translateX: interpolate(progress.value, [0, 1], [15, 0], Extrapolation.CLAMP),
        }],
    }));

    const $eRightStyle = useAnimatedStyle(() => ({
        opacity: interpolate(progress.value, [0, 0.3], [0, 1], Extrapolation.CLAMP),
        transform: [
            { scaleX: -1 }, // Inverted L
            { translateX: interpolate(progress.value, [0, 1], [15, 0], Extrapolation.CLAMP) }
        ],
    }));

    // 3. L Slide In: Translate X 20 -> 0, Opacity 0 -> 1
    const $lLeftStyle = useAnimatedStyle(() => ({
        opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
        transform: [{
            translateX: interpolate(progress.value, [0, 1], [20, 0], Extrapolation.CLAMP),
        }],
    }));

    const $lRightStyle = useAnimatedStyle(() => ({
        opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
        transform: [
            { scaleX: -1 }, // Inverted L
            { translateX: interpolate(progress.value, [0, 1], [20, 0], Extrapolation.CLAMP) }
        ],
    }));

    // Tagline Fade In (Late)
    const $taglineStyle = useAnimatedStyle(() => ({
        opacity: interpolate(curtainOpacity.value, [1, 0], [0, 1]), // Inverse of curtain
    }));

    return (
        <View style={$container}>
            {/* White/Black Sequence Background is handled by Curtain Logic or just opacity */}

            {/* Black Curtain (Fades out to reveal app behind? Or just stays black?) 
                HTML has #black-curtain over #bg-image. 
                In RN, we might just want to fade the whole splash View out or show content underneath.
                The prompt implies: Splash -> Welcome.
                So we probably keep black background until finish.
            */}

            <View style={$contentContainer}>
                <View style={$logoRow}>
                    {/* Left L */}
                    <Animated.Text style={[$logoText, $lLeftStyle]}>L</Animated.Text>

                    {/* Box [ E V E ] */}
                    <Animated.View style={[$logoBox, $boxStyle]}>
                        {/* Box Border Emulation (Optional complexity) - simple CSS border for now */}

                        <Animated.Text style={[$logoText, $eLeftStyle]}>E</Animated.Text>
                        <Text style={[$logoText, $greenLogoText]}>V</Text>
                        <Animated.Text style={[$logoText, $eRightStyle]}>E</Animated.Text>
                    </Animated.View>

                    {/* Right L */}
                    <Animated.Text style={[$logoText, $invertedL, $lRightStyle]}>L</Animated.Text>
                </View>

                <Animated.Text style={[$tagline, $taglineStyle]}>ELEVATE YOUR FORM.</Animated.Text>
            </View>
        </View>
    )
}

const $container: ViewStyle = {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
}

const $contentContainer: ViewStyle = {
    alignItems: "center",
    justifyContent: "center",
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
    overflow: "hidden", // Clip content as it expands
}

const $logoText: TextStyle = {
    fontFamily: "SpaceGrotesk-Bold", // Ensure font matches
    fontSize: 48,
    lineHeight: 52, // Match HTML approx
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
}
