// /src/store/organizationStore.ts
import { create } from 'zustand';

export const useOrganizationStore = create((set) => ({
  organizations: [],
  disabledOrganizations: [],
  setOrganizations: (data) => set({ organizations: data }),
  setDisabledOrganizations: (data) => set({ disabledOrganizations: data }),
  addOrganization: (org) => set((state) => ({ organizations: [org, ...state.organizations] })),
}));
