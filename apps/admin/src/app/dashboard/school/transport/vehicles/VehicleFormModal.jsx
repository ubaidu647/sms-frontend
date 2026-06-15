'use client';
import React, { useEffect, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchData, postData, putData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import {
  VEHICLE_TYPES,
  FUEL_TYPES,
  OWNERSHIP_TYPES,
  VEHICLE_STATUSES,
} from '@/constants/transport';

const inputCls =
  'w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 bg-white placeholder:text-gray-400';
const labelCls = 'block text-xs font-semibold text-gray-700 mb-1';
const sectionCls = 'text-xs font-bold text-gray-500 uppercase tracking-widest mb-3';

const blank = () => ({
  branchId: '',
  registrationNumber: '',
  vehicleType: 'bus',
  make: '',
  modelName: '',
  manufactureYear: '',
  color: '',
  fuelType: 'diesel',
  capacity: '',
  ownership: 'owned',
  insuranceNumber: '',
  insuranceExpiry: '',
  fitnessExpiry: '',
  registrationExpiry: '',
  status: 'active',
  driver: { name: '', phone: '', cnic: '', licenseNumber: '', licenseExpiry: '' },
  conductor: { name: '', phone: '' },
  trackerId: '',
  notes: '',
});

const toYMD = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

export default function VehicleFormModal({ isOpen, onClose, vehicle }) {
  const isEdit = !!vehicle;
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const isAdmin = !!user?.role?.isPredefined;
  const canCreateAllBranch =
    isAdmin || !!user?.role?.actions?.includes('create-all-branch-vehicle');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const [form, setForm] = useState(blank());
  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit) {
      setForm({
        branchId: vehicle.branchId?._id || vehicle.branchId || '',
        registrationNumber: vehicle.registrationNumber || '',
        vehicleType: vehicle.vehicleType || 'bus',
        make: vehicle.make || '',
        modelName: vehicle.modelName || '',
        manufactureYear: vehicle.manufactureYear ?? '',
        color: vehicle.color || '',
        fuelType: vehicle.fuelType || 'diesel',
        capacity: vehicle.capacity ?? '',
        ownership: vehicle.ownership || 'owned',
        insuranceNumber: vehicle.insuranceNumber || '',
        insuranceExpiry: toYMD(vehicle.insuranceExpiry),
        fitnessExpiry: toYMD(vehicle.fitnessExpiry),
        registrationExpiry: toYMD(vehicle.registrationExpiry),
        status: vehicle.status || 'active',
        driver: {
          name: vehicle.driver?.name || '',
          phone: vehicle.driver?.phone || '',
          cnic: vehicle.driver?.cnic || '',
          licenseNumber: vehicle.driver?.licenseNumber || '',
          licenseExpiry: toYMD(vehicle.driver?.licenseExpiry),
        },
        conductor: {
          name: vehicle.conductor?.name || '',
          phone: vehicle.conductor?.phone || '',
        },
        trackerId: vehicle.trackerId || '',
        notes: vehicle.notes || '',
      });
    } else {
      setForm({ ...blank(), branchId: canCreateAllBranch ? '' : userBranchId });
    }
    setSubmitError('');
    setSuccessState(false);
  }, [isOpen, isEdit, vehicle, canCreateAllBranch, userBranchId]);

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOpen && canCreateAllBranch && !isEdit,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setNested = (group, key, value) =>
    setForm((f) => ({ ...f, [group]: { ...f[group], [key]: value } }));

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit
        ? putData({ url: `/transport/vehicle/${vehicle._id}`, payload, token })
        : postData({ url: '/transport/vehicle', payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || (isEdit ? 'Vehicle updated' : 'Vehicle created'));
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setSuccessState(true);
      setTimeout(() => {
        setSuccessState(false);
        onClose();
      }, 700);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to save vehicle';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const validate = () => {
    if (!isEdit && !form.branchId) return 'Branch is required';
    if (!form.registrationNumber?.trim()) return 'Registration number is required';
    if (!VEHICLE_TYPES.includes(form.vehicleType)) return 'Vehicle type is invalid';
    if (!FUEL_TYPES.includes(form.fuelType)) return 'Fuel type is invalid';
    if (!OWNERSHIP_TYPES.includes(form.ownership)) return 'Ownership is invalid';
    if (form.capacity === '' || Number(form.capacity) <= 0)
      return 'Capacity must be greater than 0';
    if (!form.driver.name?.trim()) return 'Driver name is required';
    if (!form.driver.phone?.trim()) return 'Driver phone is required';
    if (!form.driver.licenseNumber?.trim()) return 'Driver license number is required';
    return null;
  };

  const handleSubmit = () => {
    setSubmitError('');
    const err = validate();
    if (err) {
      setSubmitError(err);
      toast.error(err);
      return;
    }

    const payload = {
      registrationNumber: form.registrationNumber.trim(),
      vehicleType: form.vehicleType,
      capacity: Number(form.capacity),
      fuelType: form.fuelType,
      ownership: form.ownership,
      driver: {
        name: form.driver.name.trim(),
        phone: form.driver.phone.trim(),
        licenseNumber: form.driver.licenseNumber.trim(),
      },
    };

    if (form.make?.trim()) payload.make = form.make.trim();
    if (form.modelName?.trim()) payload.modelName = form.modelName.trim();
    if (form.manufactureYear !== '' && !Number.isNaN(Number(form.manufactureYear)))
      payload.manufactureYear = Number(form.manufactureYear);
    if (form.color?.trim()) payload.color = form.color.trim();
    if (form.insuranceNumber?.trim()) payload.insuranceNumber = form.insuranceNumber.trim();
    if (form.insuranceExpiry) payload.insuranceExpiry = form.insuranceExpiry;
    if (form.fitnessExpiry) payload.fitnessExpiry = form.fitnessExpiry;
    if (form.registrationExpiry) payload.registrationExpiry = form.registrationExpiry;
    if (form.driver.cnic?.trim()) payload.driver.cnic = form.driver.cnic.trim();
    if (form.driver.licenseExpiry) payload.driver.licenseExpiry = form.driver.licenseExpiry;
    if (form.conductor.name?.trim()) {
      payload.conductor = { name: form.conductor.name.trim() };
      if (form.conductor.phone?.trim()) payload.conductor.phone = form.conductor.phone.trim();
    }
    if (form.trackerId?.trim()) payload.trackerId = form.trackerId.trim();
    if (form.notes?.trim()) payload.notes = form.notes.trim();

    if (!isEdit) {
      payload.branchId = form.branchId;
    } else if (form.status) {
      payload.status = form.status;
    }

    mutation.mutate(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Vehicle' : 'New Vehicle'}
      subtitle={
        isEdit
          ? 'Update vehicle details, driver info, and status'
          : 'Register a new vehicle for transport'
      }
      size="xl"
      footer={
        <div className="flex gap-3 w-full">
          <Button
            label="Cancel"
            handleClick={onClose}
            type="button"
            styleObject={{
              baseColor: 'bg-white border border-gray-300',
              hoverColor: 'hover:bg-gray-50',
              rounded: 'rounded-full',
              size: 'px-10 py-3 text-md min-h-[3rem]',
              textColor: 'text-gray-700',
            }}
          />
          <Button
            label={isEdit ? 'Save Changes' : 'Create Vehicle'}
            styleObject={{
              baseColor: 'bg-teal-600',
              hoverColor: 'hover:bg-teal-700',
              rounded: 'rounded-full',
              size: 'px-10 py-3 text-md min-h-[3rem]',
              textColor: 'text-white',
            }}
            loading={mutation.isPending}
            success={successState}
            handleClick={handleSubmit}
          />
        </div>
      }
    >
      <div className="space-y-6">
        {submitError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {submitError}
          </div>
        )}

        <div>
          <h3 className={sectionCls}>Vehicle Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {!isEdit && canCreateAllBranch && (
              <div>
                <label className={labelCls}>
                  Branch<span className="text-red-500">*</span>
                </label>
                <select
                  value={form.branchId}
                  onChange={(e) => set('branchId', e.target.value)}
                  className={inputCls}
                >
                  <option value="">Select branch...</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className={labelCls}>
                Registration #<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.registrationNumber}
                onChange={(e) => set('registrationNumber', e.target.value)}
                placeholder="ABC-123"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>
                Type<span className="text-red-500">*</span>
              </label>
              <select
                value={form.vehicleType}
                onChange={(e) => set('vehicleType', e.target.value)}
                className={inputCls}
              >
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>
                Capacity<span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => set('capacity', e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>
                Fuel<span className="text-red-500">*</span>
              </label>
              <select
                value={form.fuelType}
                onChange={(e) => set('fuelType', e.target.value)}
                className={inputCls}
              >
                {FUEL_TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>
                Ownership<span className="text-red-500">*</span>
              </label>
              <select
                value={form.ownership}
                onChange={(e) => set('ownership', e.target.value)}
                className={inputCls}
              >
                {OWNERSHIP_TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Make</label>
              <input
                type="text"
                value={form.make}
                onChange={(e) => set('make', e.target.value)}
                placeholder="Toyota"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Model</label>
              <input
                type="text"
                value={form.modelName}
                onChange={(e) => set('modelName', e.target.value)}
                placeholder="Hino"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Manufacture Year</label>
              <input
                type="number"
                min={1950}
                max={new Date().getFullYear() + 1}
                value={form.manufactureYear}
                onChange={(e) => set('manufactureYear', e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Color</label>
              <input
                type="text"
                value={form.color}
                onChange={(e) => set('color', e.target.value)}
                className={inputCls}
              />
            </div>

            {isEdit && (
              <div>
                <label className={labelCls}>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => set('status', e.target.value)}
                  className={inputCls}
                >
                  {VEHICLE_STATUSES.map((s) => (
                    <option key={s} value={s} className="capitalize">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className={labelCls}>Tracker ID</label>
              <input
                type="text"
                value={form.trackerId}
                onChange={(e) => set('trackerId', e.target.value)}
                placeholder="GPS-DEV-001"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className={sectionCls}>Compliance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Insurance #</label>
              <input
                type="text"
                value={form.insuranceNumber}
                onChange={(e) => set('insuranceNumber', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Insurance Expiry</label>
              <input
                type="date"
                value={form.insuranceExpiry}
                onChange={(e) => set('insuranceExpiry', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Fitness Expiry</label>
              <input
                type="date"
                value={form.fitnessExpiry}
                onChange={(e) => set('fitnessExpiry', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Registration Expiry</label>
              <input
                type="date"
                value={form.registrationExpiry}
                onChange={(e) => set('registrationExpiry', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className={sectionCls}>Driver</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>
                Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.driver.name}
                onChange={(e) => setNested('driver', 'name', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                Phone<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.driver.phone}
                onChange={(e) => setNested('driver', 'phone', e.target.value)}
                placeholder="+923001234567"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>CNIC</label>
              <input
                type="text"
                value={form.driver.cnic}
                onChange={(e) => setNested('driver', 'cnic', e.target.value)}
                placeholder="12345-1234567-1"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                License #<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.driver.licenseNumber}
                onChange={(e) => setNested('driver', 'licenseNumber', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>License Expiry</label>
              <input
                type="date"
                value={form.driver.licenseExpiry}
                onChange={(e) => setNested('driver', 'licenseExpiry', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className={sectionCls}>Conductor (optional)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Name</label>
              <input
                type="text"
                value={form.conductor.name}
                onChange={(e) => setNested('conductor', 'name', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input
                type="text"
                value={form.conductor.phone}
                onChange={(e) => setNested('conductor', 'phone', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            className={inputCls}
          />
        </div>
      </div>
    </Modal>
  );
}
