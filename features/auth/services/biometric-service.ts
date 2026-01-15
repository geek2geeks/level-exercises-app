import * as LocalAuthentication from 'expo-local-authentication';

export const BiometricService = {
    checkAvailability: async () => {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        return hasHardware && isEnrolled;
    },

    authenticate: async (promptMessage = 'Authenticate to access LEVEL'): Promise<boolean> => {
        try {
            const isAvailable = await BiometricService.checkAvailability();
            if (!isAvailable) return true; // Fallback to allow if no bio setup (or handle as error)

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage,
                fallbackLabel: 'Use Passcode',
            });

            return result.success;
        } catch (e) {
            console.error('Biometric auth failed', e);
            return false;
        }
    },
};

export default function () { return null; }
