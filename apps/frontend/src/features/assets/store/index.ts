import { create } from 'zustand';
import type { AssetStatus, AssetCondition } from '@/types';

interface AssetFilterState {
  categoryId: number | undefined;
  typeId: number | undefined;
  modelId: number | undefined;
  status: AssetStatus | undefined;
  condition: AssetCondition | undefined;
  search: string;
  setCategoryId: (id: number | undefined) => void;
  setTypeId: (id: number | undefined) => void;
  setModelId: (id: number | undefined) => void;
  setStatus: (status: AssetStatus | undefined) => void;
  setCondition: (condition: AssetCondition | undefined) => void;
  setSearch: (search: string) => void;
  resetFilters: () => void;
}

const initialState = {
  categoryId: undefined,
  typeId: undefined,
  modelId: undefined,
  status: undefined,
  condition: undefined,
  search: '',
};

export const useAssetFilterStore = create<AssetFilterState>((set) => ({
  ...initialState,
  setCategoryId: (categoryId) => set({ categoryId, typeId: undefined, modelId: undefined }),
  setTypeId: (typeId) => set({ typeId, modelId: undefined }),
  setModelId: (modelId) => set({ modelId }),
  setStatus: (status) => set({ status }),
  setCondition: (condition) => set({ condition }),
  setSearch: (search) => set({ search }),
  resetFilters: () => set(initialState),
}));
