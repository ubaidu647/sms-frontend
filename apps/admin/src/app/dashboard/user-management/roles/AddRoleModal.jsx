'use client';
import React, { useEffect, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchData, postData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { AVAILABLE_MENUS, AVAILABLE_ACTIONS, ACTIONS } from '@/constants/rolePermissions';

const PRESETS = {
  teacher: {
    label: 'Teacher',
    name: 'Teacher',
    menus: [
      'staff',
      'class',
      'subject',
      'student',
      'attendance',
      'staff-attendance',
      'teaching-assignment',
      'exam',
      'timetable',
      'announcement',
      'payslip',
      'salary-structure',
    ],
    actions: [
      ACTIONS.VIEW_OWN_STAFF,
      ACTIONS.UPDATE_OWN_STAFF,
      ACTIONS.VIEW_CLASS,
      ACTIONS.VIEW_OWN_SUBJECT,
      ACTIONS.VIEW_STUDENT,
      ACTIONS.MARK_ATTENDANCE,
      ACTIONS.VIEW_ATTENDANCE,
      ACTIONS.UPDATE_ATTENDANCE,
      ACTIONS.VIEW_OWN_STAFF_ATTENDANCE,
      ACTIONS.VIEW_OWN_TEACHING_ASSIGNMENT,
      ACTIONS.VIEW_EXAM,
      ACTIONS.CREATE_EXAM,
      ACTIONS.UPDATE_EXAM,
      ACTIONS.PUBLISH_EXAM,
      ACTIONS.ENTER_MARKS,
      ACTIONS.VIEW_MARKS,
      ACTIONS.VIEW_OWN_TIMETABLE,
      ACTIONS.VIEW_ANNOUNCEMENT,
      ACTIONS.VIEW_OWN_PAYSLIP,
      ACTIONS.VIEW_OWN_STAFF_SALARY,
    ],
  },
  student: {
    label: 'Student / Parent',
    name: 'Student',
    menus: [
      'student',
      'attendance',
      'exam',
      'timetable',
      'fee',
      'transport-assignment',
      'announcement',
    ],
    actions: [
      ACTIONS.VIEW_OWN_STUDENT,
      ACTIONS.VIEW_OWN_ATTENDANCE,
      ACTIONS.VIEW_OWN_MARKS,
      ACTIONS.VIEW_OWN_TIMETABLE,
      ACTIONS.VIEW_OWN_FEE,
      ACTIONS.VIEW_OWN_PAYMENT,
      ACTIONS.VIEW_OWN_TRANSPORT_ASSIGNMENT,
      ACTIONS.VIEW_ANNOUNCEMENT,
    ],
  },
};

const roleSchema = yup.object().shape({
  name: yup.string().required('Role name is required'),
  branchId: yup.string().required('Branch is required'),
  menus: yup.array().of(yup.string()).min(1, 'Select at least one menu'),
  actions: yup.array().of(yup.string()).min(1, 'Select at least one action'),
});

export default function AddRoleModal({ isOpen, onClose, onSuccess }) {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState(false);

  const isAdmin = !!user?.role?.isPredefined;
  // Support both user.branchId (plain id) and user.branch._id (populated object)
  const userBranchId = user?.branchId || user?.branch?._id || '';

  // Fetch branches only when admin and modal is open
  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isAdmin && isOpen,
  });
  const branches = branchData?.data || [];

  // Only show menus/actions the current user has access to
  const allowedMenus = isAdmin
    ? AVAILABLE_MENUS
    : AVAILABLE_MENUS.filter((m) => user?.role?.menus?.includes(m.key));

  const allowedActions = isAdmin
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
    resolver: yupResolver(roleSchema),
    defaultValues: { name: '', branchId: '', menus: [], actions: [] },
  });

  const selectedMenus = watch('menus') || [];
  const selectedActions = watch('actions') || [];

  // For non-admin users, silently set their own branchId once the modal opens
  useEffect(() => {
    if (isOpen && !isAdmin && userBranchId) {
      setValue('branchId', userBranchId, { shouldValidate: true });
    }
  }, [isOpen, isAdmin, userBranchId, setValue]);

  useEffect(() => {
    if (!isOpen) {
      reset();
      setSubmitError('');
      setSuccessState(false);
    }
  }, [isOpen, reset]);

  const toggleItem = (field, key) => {
    const current = field === 'menus' ? selectedMenus : selectedActions;
    const updated = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
    setValue(field, updated, { shouldValidate: true });

    // When a menu is removed, also remove its actions from the selection
    if (field === 'menus' && current.includes(key)) {
      const menuActionKeys = allowedActions.filter((a) => a.menu === key).map((a) => a.key);
      const cleanedActions = selectedActions.filter((a) => !menuActionKeys.includes(a));
      setValue('actions', cleanedActions, { shouldValidate: true });
    }
  };

  const createRoleMutation = useMutation({
    mutationFn: (payload) => postData({ url: '/role/create', payload, token }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success(res?.message || 'Role created');
      onSuccess?.(res?.data);
      setSuccessState(true);
      setTimeout(() => {
        setSuccessState(false);
        reset();
        onClose();
      }, 1000);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to create role';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const onSubmit = (data) => {
    setSubmitError('');
    createRoleMutation.mutate(data);
  };

  const applyPreset = (key) => {
    const p = PRESETS[key];
    if (!p) return;
    const allowedMenuKeys = new Set(allowedMenus.map((m) => m.key));
    const allowedActionKeys = new Set(allowedActions.map((a) => a.key));
    setValue('name', p.name, { shouldValidate: true });
    setValue(
      'menus',
      p.menus.filter((m) => allowedMenuKeys.has(m)),
      {
        shouldValidate: true,
      },
    );
    setValue(
      'actions',
      p.actions.filter((a) => allowedActionKeys.has(a)),
      {
        shouldValidate: true,
      },
    );
  };

  // Only show action groups for menus the user has selected.
  // Branch / All-branch actions are listed under each menu group;
  // own-scope actions are pulled out to a separate "Self-scoped" section
  // so admins can see they're weaker than branch-level grants.
  const actionsByMenu = allowedMenus
    .filter((menu) => selectedMenus.includes(menu.key))
    .map((menu) => ({
      ...menu,
      actions: allowedActions.filter((a) => a.menu === menu.key && a.scope !== 'own'),
    }))
    .filter((g) => g.actions.length > 0);

  const ownActionsByMenu = allowedMenus
    .filter((menu) => selectedMenus.includes(menu.key))
    .map((menu) => ({
      ...menu,
      actions: allowedActions.filter((a) => a.menu === menu.key && a.scope === 'own'),
    }))
    .filter((g) => g.actions.length > 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Role"
      subtitle="Define a role with specific menus and permissions"
      footer={
        <div className="flex gap-3 w-full">
          <Button label="Cancel" handleClick={onClose} variant="secondary" type="button" />
          <Button
            label="Create Role"
            styleObject={{
              baseColor: 'bg-black',
              hoverColor: 'hover:bg-gray-800',
              rounded: 'rounded-full',
              size: 'px-10 py-3 text-md min-h-[3rem]',
              textColor: 'text-white',
            }}
            loading={createRoleMutation.isPending}
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

        {/* Presets — pre-fill name/menus/actions for common roles */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Quick presets
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PRESETS).map(([key, preset]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className="px-3 py-1.5 rounded-full text-xs font-medium border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Applies a recommended set — you can still adjust before saving.
          </p>
        </div>

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
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        {/* Branch — only visible to admin; non-admin gets their branch set silently */}
        {isAdmin && (
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
          {errors.menus && <p className="text-red-500 text-xs mt-1">{errors.menus.message}</p>}
        </div>

        {/* Actions grouped by menu */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Actions <span className="text-red-500">*</span>
          </label>
          {selectedMenus.length === 0 && (
            <p className="text-gray-400 dark:text-gray-500 text-xs mb-2">
              Select a menu above to see its actions.
            </p>
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
          {errors.actions && <p className="text-red-500 text-xs mt-1">{errors.actions.message}</p>}
        </div>

        {/* Self-scoped (own data only) — shown only when at least one selected
            menu has own-scope actions available */}
        {ownActionsByMenu.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Self-scoped{' '}
              <span className="font-normal text-gray-500 dark:text-gray-400">(own data only)</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              These permissions are weaker than the branch-level ones above — they only let the user
              see/update their own record.
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
