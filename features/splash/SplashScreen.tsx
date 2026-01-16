import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ImageStyle, Text, TextStyle, View, ViewStyle } from "react-native";
import Animated, {
    Easing,
    Extrapolation,
    interpolate,
    interpolateColor,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from "react-native-reanimated";

// Hardcoded colors/styles if theme is missing, or import if available. 
// Assuming standard palette from inspection.
const colors = {
    transparent: "transparent",
    palette: {
        neutral100: "#FFFFFF",
        primary500: "#CCFF00", // The level-fitness green
    }
}

const splashIcon = require("../../assets/images/android-icon-foreground.png")

export const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
    const router = useRouter()
    const logoProgress = useSharedValue(0)
    const iconOpacity = useSharedValue(1)
    const textOpacity = useSharedValue(0)

    useEffect(() => {
        // Sequence:
        // 1. Wait 500ms (showing Static Icon, matching Native Splash)
        // 2. Crossfade: Icon Out, Text In (Text is in LVL state)
        // 3. Animate Text: LVL -> LEVEL
        // 4. Navigate

        // Start Crossfade after delay
        iconOpacity.value = withDelay(500, withTiming(0, { duration: 500 }))
        textOpacity.value = withDelay(500, withTiming(1, { duration: 500 }))

        // Start Expansion after crossfade
        logoProgress.value = withDelay(
            1000,
            withTiming(1, { duration: 1500, easing: Easing.out(Easing.exp) }, (finished) => {
                if (finished) {
                    runOnJS(onFinish)()
                }
            }),
        )
    }, [])

    const $animatedBoxStyle = useAnimatedStyle(() => ({
        borderColor: interpolateColor(
            logoProgress.value,
            [0, 1],
            [colors.transparent, colors.palette.neutral100],
        ),
    }))

    const $animatedEStyle = useAnimatedStyle(() => ({
        opacity: interpolate(logoProgress.value, [0, 0.5], [0, 1], Extrapolation.CLAMP),
        width: interpolate(logoProgress.value, [0, 1], [0, 35], Extrapolation.CLAMP),
        transform: [
            {
                translateX: interpolate(logoProgress.value, [0, 1], [10, 0], Extrapolation.CLAMP),
            },
        ],
    }))

    const $iconStyle = useAnimatedStyle(() => ({
        opacity: iconOpacity.value,
    }))

    const $textContainerStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
    }))

    return (
        <View style={$container}>
            <View style={$contentContainer}>
                {/* Static Icon Layer */}
                <View style={[$logoRowOuter, { position: 'absolute' }]}>
                    <Animated.Image
                        source={splashIcon}
                        style={[$splashImage, $iconStyle]}
                        resizeMode="contain"
                    />
                </View>

                {/* Animated Text Layer */}
                <Animated.View style={[$logoRowOuter, $textContainerStyle]}>
                    <Text style={$logoText}>L</Text>
                    <Animated.View style={[$logoBox, $animatedBoxStyle]}>
                        <Animated.View style={[{ overflow: "hidden" }, $animatedEStyle]}>
                            <Text style={$logoText}>E</Text>
                        </Animated.View>
                        <Text style={[$logoText, $greenLogoText]}>V</Text>
                        <Animated.View style={[{ overflow: "hidden" }, $animatedEStyle]}>
                            <Text style={[$logoText, $invertedL]}>E</Text>
                        </Animated.View>
                    </Animated.View>
                    <Text style={[$logoText, $invertedL]}>L</Text>
                </Animated.View>

                <Animated.View style={{ opacity: logoProgress }}>
                    <Text style={$tagline}>ELEVATE YOUR FORM.</Text>
                </Animated.View>
            </View>
        </View>
    )
}

// STYLES
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

const $logoRowOuter: ViewStyle = {
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
}

const $logoBox: ViewStyle = {
    borderWidth: 4,
    borderColor: colors.palette.neutral100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 4,
    gap: 4,
}

const $logoText: TextStyle = {
    fontFamily: "SpaceGrotesk-Bold", // Ensure this font is loaded in RootLayout
    fontSize: 48,
    lineHeight: 52,
    fontWeight: "900",
    color: colors.palette.neutral100,
}

const $invertedL: TextStyle = {
    transform: [{ scaleX: -1 }],
}

const $greenLogoText: TextStyle = {
    color: colors.palette.primary500,
}

const $splashImage: ImageStyle = {
    width: 300,
    height: 300,
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
