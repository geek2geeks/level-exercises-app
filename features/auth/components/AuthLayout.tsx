import { AnimatedBackground } from '@features/welcome/components/AnimatedBackground';
import React from 'react';
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <AnimatedBackground />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        contentContainerStyle={[
                            styles.scrollContent,
                            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }
                        ]}
                        showsVerticalScrollIndicator={false}
                    >
                        {children}
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
});
