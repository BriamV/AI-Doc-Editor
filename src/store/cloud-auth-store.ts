import { StoreApi } from 'zustand';
import { createWithEqualityFn } from 'zustand/traditional';
import { persist } from 'zustand/middleware';
import { CloudAuthSlice, createCloudAuthSlice } from './cloud-auth-slice';

export type StoreState = CloudAuthSlice;

export type StoreSlice<T> = (
  set: StoreApi<StoreState>['setState'],
  get: StoreApi<StoreState>['getState']
) => T;

const useCloudAuthStore = createWithEqualityFn<StoreState>()(
  persist(
    (set, get) => ({
      ...createCloudAuthSlice(set, get),
    }),
    {
      name: 'cloud',
      partialize: state => ({
        cloudSync: state.cloudSync,
        fileId: state.fileId,
      }),
      version: 1,
    }
  )
);

export default useCloudAuthStore;
