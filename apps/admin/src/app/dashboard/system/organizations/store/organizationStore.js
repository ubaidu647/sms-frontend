// /src/store/organizationStore.ts
import { create } from 'zustand';

const isDisabled = (org) => org?.isActive === false || org?.status === 'suspended';

export const useOrganizationStore = create((set) => ({
  organizations: [],
  disabledOrganizations: [],
  setOrganizations: (data) => {
    const list = Array.isArray(data) ? data : [];
    set({
      organizations: list.filter((o) => !isDisabled(o)),
      disabledOrganizations: list.filter(isDisabled),
    });
  },
  setDisabledOrganizations: (data) => set({ disabledOrganizations: data }),
  addOrganization: (org) =>
    set((state) =>
      isDisabled(org)
        ? { disabledOrganizations: [org, ...state.disabledOrganizations] }
        : { organizations: [org, ...state.organizations] },
    ),
  applyStatusChange: (updated) =>
    set((state) => {
      const id = updated?._id;
      if (!id) return state;
      const stripped = {
        organizations: state.organizations.filter((o) => o._id !== id),
        disabledOrganizations: state.disabledOrganizations.filter((o) => o._id !== id),
      };
      return isDisabled(updated)
        ? { ...stripped, disabledOrganizations: [updated, ...stripped.disabledOrganizations] }
        : { ...stripped, organizations: [updated, ...stripped.organizations] };
    }),
}));
