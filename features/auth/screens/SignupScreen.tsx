import { AuthLayout } from '@features/auth/components/AuthLayout';
import { FirebaseAuthService } from '@features/auth/services/firebase-auth';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { z } from 'zod';

const signupSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export const SignupScreen = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignup = async () => {
        setError(null);
        setLoading(true);

        try {
            signupSchema.parse({ email, password, confirmPassword });
            const { error: authError } = await FirebaseAuthService.signup(email, password);

            if (authError) {
                setError(authError);
            } else {
                // Success handled by AuthStore listener
            }
        } catch (e: any) {
            if (e instanceof z.ZodError) {
                // @ts-ignore
                setError(e.errors[0].message);
            } else {
                setError('An unexpected error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <View style={styles.header}>
                <Text style={styles.title}>CREATE ACCOUNT</Text>
                <Text style={styles.subtitle}>Begin your journey to strict form</Text>
            </View>

            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>EMAIL</Text>
                    <TextInput
                        style={styles.input}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        placeholder="john@example.com"
                        placeholderTextColor="#666"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>PASSWORD</Text>
                    <TextInput
                        style={styles.input}
                        secureTextEntry
                        placeholder="••••••••"
                        placeholderTextColor="#666"
                        value={password}
                        onChangeText={setPassword}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>CONFIRM PASSWORD</Text>
                    <TextInput
                        style={styles.input}
                        secureTextEntry
                        placeholder="••••••••"
                        placeholderTextColor="#666"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                    />
                </View>

                {error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleSignup}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <Text style={styles.buttonText}>SIGN UP</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <Link href="/(auth)/login" asChild>
                        <TouchableOpacity>
                            <Text style={styles.linkText}>Log In</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </AuthLayout>
    );
};

const styles = StyleSheet.create({
    header: {
        marginBottom: 40,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 32,
        fontFamily: 'SpaceGrotesk_700Bold',
        marginBottom: 8,
    },
    subtitle: {
        color: '#A0A0A0',
        fontSize: 16,
        fontFamily: 'SpaceGrotesk_400Regular',
    },
    form: {
        gap: 24,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        color: '#CCFF00',
        fontSize: 12,
        fontFamily: 'SpaceGrotesk_700Bold',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 16,
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'SpaceGrotesk_400Regular',
    },
    errorText: {
        color: '#FF4444',
        fontSize: 14,
        fontFamily: 'SpaceGrotesk_500Medium',
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#CCFF00',
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#000000',
        fontSize: 16,
        fontFamily: 'SpaceGrotesk_700Bold',
        letterSpacing: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
    },
    footerText: {
        color: '#A0A0A0',
        fontSize: 14,
        fontFamily: 'SpaceGrotesk_400Regular',
    },
    linkText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'SpaceGrotesk_700Bold',
        textDecorationLine: 'underline',
    },
});
