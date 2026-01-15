import { Instance, SnapshotOut, types } from 'mobx-state-tree';
import { AuthStore } from './auth-store';

export const RootStoreModel = types.model('RootStore').props({
    authStore: types.optional(AuthStore, {}),
});

export interface RootStore extends Instance<typeof RootStoreModel> { }
export interface RootStoreSnapshot extends SnapshotOut<typeof RootStoreModel> { }
