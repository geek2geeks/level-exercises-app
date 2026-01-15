import { auth } from '@shared/services/firebase/config';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    User,
} from 'firebase/auth';

export const FirebaseAuthService = {
    login: async (email: string, pass: string) => {
        try {
            const cred = await signInWithEmailAndPassword(auth, email, pass);
            return { user: cred.user, error: null };
        } catch (e: any) {
            return { user: null, error: e.message };
        }
    },

    signup: async (email: string, pass: string) => {
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, pass);
            return { user: cred.user, error: null };
        } catch (e: any) {
            return { user: null, error: e.message };
        }
    },

    logout: async () => {
        await signOut(auth);
    },

    getUser: (): User | null => {
        return auth.currentUser;
    },
};
