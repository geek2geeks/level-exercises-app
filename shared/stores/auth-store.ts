import { auth } from '@shared/services/firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import { flow, types } from 'mobx-state-tree';

export const AuthStore = types
    .model('AuthStore')
    .props({
        authToken: types.maybe(types.string),
        userId: types.maybe(types.string),
        email: types.maybe(types.string),
        isAuthenticated: types.optional(types.boolean, false),
        isLoading: types.optional(types.boolean, true),
    })
    .actions((self) => ({
        setAuthToken(token: string) {
            self.authToken = token;
        },
        setUser(user: User | null) {
            if (user) {
                self.userId = user.uid;
                self.email = user.email || undefined;
                self.isAuthenticated = true;
            } else {
                self.userId = undefined;
                self.email = undefined;
                self.isAuthenticated = false;
                self.authToken = undefined;
            }
            self.isLoading = false;
        },
        setLoading(loading: boolean) {
            self.isLoading = loading;
        },
    }))
    .actions((self) => ({
        initialize() {
            self.setLoading(true);
            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                try {
                    if (user) {
                        // Unblock the app immediately by setting the user
                        // We can verify biometrics in a separate step if needed
                        const token = await user.getIdToken();
                        self.setAuthToken(token);
                        self.setUser(user);

                        // Optional: Trigger biometric check in the background or after mount
                        // For now, let's just make sure we are not blocking the login flow
                        // BiometricService.authenticate().then(success => { ... });
                    } else {
                        self.setUser(null);
                    }
                } catch (error) {
                    console.error('Auth initialization error:', error);
                    self.setUser(null);
                }
            });
            return unsubscribe;
        },
        logout: flow(function* () {
            try {
                yield auth.signOut();
                // The listener will handle state update
            } catch (e) {
                console.error('Logout failed', e);
            }
        }),
    }));
