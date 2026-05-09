'use client';
import React, { useEffect, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchData, putData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { AVAILABLE_MENUS, AVAILABLE_ACTIONS } from '@/constants/rolePermissions';

const editRoleSchema = yup.object().shape({
  name: yup.string().required('Role name is required'),
  branchId: yup.string().required('Branch is required'),
  menus: yup.array().of(yup.string()).min(1, 'Select at least one menu'),
  actions: yup.array().of(yup.string()).min(1, 'Select at least one action'),
});

export default function EditRoleModal({ isOpen, onClose, onSuccess, role }) {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState(false);

  const canChangeBranch =
    !!user?.role?.isPredefined || !!user?.role?.actions?.includes('update-all-branch-role');

  const userBranchId = user?.branchId || user?.branch?._id || '';

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && canChangeBranch && isOpen,
  });
  const branches = branchData?.data || [];

  const allowedMenus = canChangeBranch
    ? AVAILABLE_MENUS
    : AVAILABLE_MENUS.filter((m) => user?.role?.menus?.includes(m.key));

  const allowedActions = canChangeBranch
    ? AVAILABLE_ACTIONS
    : AVAILABLE_ACTIONS.filter((a) => user?.role?.actions?.includes(a.key));

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(editRoleSchema),
    defaultValues: { name: '', branchId: '', menus: [], actions: [] },
  });

  const selectedMenus = watch('menus') || [];
  const selectedActions = watch('actions') || [];

  // Populate form when role changes or modal opens
  useEffect(() => {
    if (isOpen && role) {
      reset({
        name: role.name || '',
        branchId: role.branch?._id || role.branchId || (canChangeBranch ? '' : userBranchId),
        menus: role.menus || [],
        actions: role.actions || [],
      });
      setSubmitError('');
      setSuccessState(false);
    }
  }, [isOpen, role, canChangeBranch, userBranchId, reset]);

  useEffect(() => {
    if (!isOpen) {
      setSubmitError('');
      setSuccessState(false);
    }
  }, [isOpen]);

  const toggleItem = (field, key) => {
    const current = field === 'menus' ? selectedMenus : selectedActions;
    const updated = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key];
    setValue(field, updated, { shouldValidate: true });

    if (field === 'menus' && current.includes(key)) {
      const menuActionKeys = allowedActions
        .filter((a) => a.menu === key)
        .map((a) => a.key);
      const cleanedActions = selectedActions.filter((a) => !menuActionKeys.includes(a));
      setValue('actions', cleanedActions, { shouldValidate: true });
    }
  };

  const updateRoleMutation = useMutation({
    mutationFn: (payload) => putData({ url: `/role/${role._id}`, payload, token }),
    onSuccess: (res) => {
      queryClient.setQueriesData({ queryKey: ['roles'] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: (old.data || []).map((r) => (r._id === res.data._id ? res.data : r)),
        };
      });
      queryClient.setQueryData(['role-detail', role._id], res.data);
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success(res?.message || 'Role updated');
      setSuccessState(true);
      setTimeout(() => {
        setSuccessState(false);
        onSuccess?.(res?.data);
        onClose();
      }, 1000);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to update role';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const onSubmit = (formData) => {
    setSubmitError('');
    const payload = {
      name: formData.name,
      menus: formData.menus,
      actions: formData.actions,
    };
    if (canChangeBranch) payload.branchId = formData.branchId;
    updateRoleMutation.mutate(payload);
  };

  const actionsByMenu = allowedMenus
    .filter((menu) => selectedMenus.includes(menu.key))
    .map((menu) => ({
      ...menu,
      actions: allowedActions.filter(
        (a) => a.menu === menu.key && a.scope !== 'own',
      ),
    }))
    .filter((g) => g.actions.length > 0);

  const ownActionsByMenu = allowedMenus
    .filter((menu) => selectedMenus.includes(menu.key))
    .map((menu) => ({
      ...menu,
      actions: allowedActions.filter(
        (a) => a.menu === menu.key && a.scope === 'own',
      ),
    }))
    .filter((g) => g.actions.length > 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Role"
      subtitle="Update the role's name, menus, and permissions"
      footer={
        <div className="flex gap-3 w-full">
          <Button label="Cancel" handleClick={onClose} variant="secondary" type="button" />
          <Button
            label="Save Changes"
            styleObject={{
              baseColor: 'bg-black',
              hoverColor: 'hover:bg-gray-800',
              rounded: 'rounded-full',
              size: 'px-10 py-3 text-md min-h-[3rem]',
              textColor: 'text-white',
            }}
            loading={updateRoleMutation.isPending}
            success={successState}
            handleClick={handleSubmit(onSubmit)}
          />
        </div>
      }
    >
      <form className="space-y-6">
        {submitError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {submitError}
          </div>
        )}

        {/* Role Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Role Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('name')}
            placeholder="e.g. Branch Manager"
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Branch — only for users with canChangeBranch */}
        {canChangeBranch && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Branch <span className="text-red-500">*</span>
            </label>
            <select
              {...register('branchId')}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            >
              <option value="">Select a branch...</option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
            {errors.branchId && (
              <p className="text-red-500 text-xs mt-1">{errors.branchId.message}</p>
            )}
          </div>
        )}

        {/* Menus */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Menus <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {allowedMenus.map((menu) => {
              const checked = selectedMenus.includes(menu.key);
              return (
                <button
                  key={menu.key}
                  type="button"
                  onClick={() => toggleItem('menus', menu.key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    checked
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-teal-400'
                  }`}
                >
                  {menu.label}
                </button>
              );
            })}
          </div>
          {errors.menus && (
            <p className="text-red-500 text-xs mt-1">{errors.menus.message}</p>
          )}
        </div>

        {/* Actions grouped by selected menus */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Actions <span className="text-red-500">*</span>
          </label>
          {selectedMenus.length === 0 && (
            <p className="text-gray-400 dark:text-gray-500 text-xs mb-2">Select a menu above to see its actions.</p>
          )}
          <div className="space-y-4">
            {actionsByMenu.map((group) => (
              <div key={group.key}>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.actions.map((action) => {
                    const checked = selectedActions.includes(action.key);
                    return (
                      <button
                        key={action.key}
                        type="button"
                        onClick={() => toggleItem('actions', action.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          checked
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-teal-400'
                        }`}
                      >
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {errors.actions && (
            <p className="text-red-500 text-xs mt-1">{errors.actions.message}</p>
          )}
        </div>

        {ownActionsByMenu.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Self-scoped <span className="font-normal text-gray-500 dark:text-gray-400">(own data only)</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              These permissions are weaker than the branch-level ones above — they only
              let the user see/update their own record.
            </p>
            <div className="space-y-4">
              {ownActionsByMenu.map((group) => (
                <div key={`own-${group.key}`}>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.actions.map((action) => {
                      const checked = selectedActions.includes(action.key);
                      return (
                        <button
                          key={action.key}
                          type="button"
                          onClick={() => toggleItem('actions', action.key)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            checked
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-amber-400'
                          }`}
                        >
                          {action.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
