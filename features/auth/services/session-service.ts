import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'level_auth_token';
// const USER_ID_KEY = 'level_user_id'; // Optional if needed separate

export const SessionService = {
    saveSession: async (token: string) => {
        try {
            if (Platform.OS === 'web') {
                localStorage.setItem(TOKEN_KEY, token);
            } else {
                await SecureStore.setItemAsync(TOKEN_KEY, token);
            }
        } catch (e) {
            console.error('Failed to save session', e);
        }
    },

    getSession: async (): Promise<string | null> => {
        try {
            if (Platform.OS === 'web') {
                return localStorage.getItem(TOKEN_KEY);
            }
            return await SecureStore.getItemAsync(TOKEN_KEY);
        } catch (e) {
            console.error('Failed to get session', e);
            return null;
        }
    },

    clearSession: async () => {
        try {
            if (Platform.OS === 'web') {
                localStorage.removeItem(TOKEN_KEY);
            } else {
                await SecureStore.deleteItemAsync(TOKEN_KEY);
            }
        } catch (e) {
            console.error('Failed to clear session', e);
        }
    },
};
