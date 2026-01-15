import React, { createContext, useContext, useEffect, useState } from 'react';
import { RootStore, RootStoreModel } from './root-store';

const RootStoreContext = createContext<RootStore | null>(null);

export const RootStoreProvider = ({ children }: { children: React.ReactNode }) => {
    const [store, setStore] = useState<RootStore | null>(null);

    useEffect(() => {
        // In the future, we can rehydrate from storage here
        const _store = RootStoreModel.create({});
        setStore(_store);
    }, []);

    if (!store) return null;

    return (
        <RootStoreContext.Provider value={store}>
            {children}
        </RootStoreContext.Provider>
    );
};

export const useStores = () => {
    const store = useContext(RootStoreContext);
    if (store === null) {
        throw new Error('Store cannot be null, please add a context provider');
    }
    return store;
};
