'use client';
import React, { useEffect, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchData, postData, putData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';

const inputCls =
  'w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 bg-white placeholder:text-gray-400';
const labelCls = 'block text-xs font-semibold text-gray-700 mb-1';
const sectionCls = 'text-xs font-bold text-gray-500 uppercase tracking-widest mb-3';

const blankStop = (sequence = 1) => ({
  name: '',
  sequence,
  pickupTime: '',
  dropTime: '',
  fee: '',
  latitude: '',
  longitude: '',
  landmark: '',
});

export default function RouteFormModal({ isOpen, onClose, route }) {
  const isEdit = !!route;
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const isAdmin = !!user?.role?.isPredefined;
  const canCreateAllBranch = isAdmin || !!user?.role?.actions?.includes('create-all-branch-route');
  const canViewAllBranchVehicles =
    isAdmin || !!user?.role?.actions?.includes('view-all-branch-vehicle');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const [branchId, setBranchId] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [startPoint, setStartPoint] = useState('');
  const [endPoint, setEndPoint] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [estimatedDurationMin, setEstimatedDurationMin] = useState('');
  const [baseFee, setBaseFee] = useState('');
  const [stops, setStops] = useState([blankStop(1)]);
  const [notes, setNotes] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [successState, setSuccessState] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit) {
      setBranchId(route.branchId?._id || route.branchId || '');
      setName(route.name || '');
      setCode(route.code || '');
      setDescription(route.description || '');
      setVehicleId(route.vehicleId?._id || route.vehicleId || '');
      setStartPoint(route.startPoint || '');
      setEndPoint(route.endPoint || '');
      setDistanceKm(route.distanceKm ?? '');
      setEstimatedDurationMin(route.estimatedDurationMin ?? '');
      setBaseFee(route.baseFee ?? '');
      setStops(
        (route.stops || []).map((s, i) => ({
          name: s.name || '',
          sequence: s.sequence ?? i + 1,
          pickupTime: s.pickupTime || '',
          dropTime: s.dropTime || '',
          fee: s.fee ?? '',
          latitude: s.latitude ?? '',
          longitude: s.longitude ?? '',
          landmark: s.landmark || '',
        })),
      );
      setNotes(route.notes || '');
    } else {
      setBranchId(canCreateAllBranch ? '' : userBranchId);
      setName('');
      setCode('');
      setDescription('');
      setVehicleId('');
      setStartPoint('');
      setEndPoint('');
      setDistanceKm('');
      setEstimatedDurationMin('');
      setBaseFee('');
      setStops([blankStop(1)]);
      setNotes('');
    }
    setSubmitError('');
    setSuccessState(false);
  }, [isOpen, isEdit, route, canCreateAllBranch, userBranchId]);

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOpen && canCreateAllBranch && !isEdit,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const effectiveBranchForVehicles = canViewAllBranchVehicles
    ? branchId || undefined
    : userBranchId;

  const { data: vehicleData } = useQuery({
    queryKey: ['vehicles-route-dropdown', effectiveBranchForVehicles],
    queryFn: () => {
      const params = { page: 1, limit: 200, token, status: 'active', isActive: 'true' };
      if (effectiveBranchForVehicles) params.branchId = effectiveBranchForVehicles;
      return fetchData({ url: '/transport/vehicle', ...params });
    },
    enabled: !!token && isOpen,
    staleTime: 30000,
  });
  const vehicles = vehicleData?.data || [];

  const updateStop = (i, patch) => {
    setStops((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };

  const removeStop = (i) => {
    setStops((prev) =>
      prev.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, sequence: idx + 1 })),
    );
  };

  const moveStop = (i, dir) => {
    setStops((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next.map((s, idx) => ({ ...s, sequence: idx + 1 }));
    });
  };

  const addStop = () => setStops((prev) => [...prev, blankStop(prev.length + 1)]);

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit
        ? putData({ url: `/transport/route/${route._id}`, payload, token })
        : postData({ url: '/transport/route', payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || (isEdit ? 'Route updated' : 'Route created'));
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      setSuccessState(true);
      setTimeout(() => {
        setSuccessState(false);
        onClose();
      }, 700);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to save route';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const validate = () => {
    if (!isEdit && !branchId) return 'Branch is required';
    if (!name?.trim()) return 'Route name is required';
    if (!startPoint?.trim()) return 'Start point is required';
    if (!endPoint?.trim()) return 'End point is required';
    if (baseFee === '' || Number(baseFee) < 0) return 'Base fee must be ≥ 0';
    if (!stops.length) return 'At least one stop is required';
    const seqSet = new Set();
    for (let i = 0; i < stops.length; i++) {
      const s = stops[i];
      if (!s.name?.trim()) return `stops[${i}]: name is required`;
      if (!s.pickupTime || !/^\d{2}:\d{2}$/.test(s.pickupTime))
        return `stops[${i}]: pickup time must be HH:mm`;
      if (!s.dropTime || !/^\d{2}:\d{2}$/.test(s.dropTime))
        return `stops[${i}]: drop time must be HH:mm`;
      if (!s.sequence || seqSet.has(s.sequence)) return `stops[${i}]: sequence must be unique`;
      seqSet.add(s.sequence);
      if (s.fee !== '' && Number(s.fee) < 0) return `stops[${i}]: fee must be ≥ 0`;
    }
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
      name: name.trim(),
      startPoint: startPoint.trim(),
      endPoint: endPoint.trim(),
      baseFee: Number(baseFee),
      stops: stops.map((s) => {
        const out = {
          name: s.name.trim(),
          sequence: Number(s.sequence),
          pickupTime: s.pickupTime,
          dropTime: s.dropTime,
        };
        if (s.fee !== '' && !Number.isNaN(Number(s.fee))) out.fee = Number(s.fee);
        if (s.latitude !== '' && !Number.isNaN(Number(s.latitude)))
          out.latitude = Number(s.latitude);
        if (s.longitude !== '' && !Number.isNaN(Number(s.longitude)))
          out.longitude = Number(s.longitude);
        if (s.landmark?.trim()) out.landmark = s.landmark.trim();
        return out;
      }),
    };

    if (code?.trim()) payload.code = code.trim();
    if (description?.trim()) payload.description = description.trim();
    if (vehicleId) payload.vehicleId = vehicleId;
    if (distanceKm !== '' && !Number.isNaN(Number(distanceKm)))
      payload.distanceKm = Number(distanceKm);
    if (estimatedDurationMin !== '' && !Number.isNaN(Number(estimatedDurationMin)))
      payload.estimatedDurationMin = Number(estimatedDurationMin);
    if (notes?.trim()) payload.notes = notes.trim();

    if (!isEdit) payload.branchId = branchId;

    mutation.mutate(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Route' : 'New Route'}
      subtitle={
        isEdit
          ? 'Update route details, stops, and assigned vehicle'
          : 'Define a new transport route with stops and pickup/drop times'
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
            label={isEdit ? 'Save Changes' : 'Create Route'}
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
          <h3 className={sectionCls}>Route Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!isEdit && canCreateAllBranch && (
              <div>
                <label className={labelCls}>
                  Branch<span className="text-red-500">*</span>
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
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
                Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Route A — North"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="R-01"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Vehicle</label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className={inputCls}
              >
                <option value="">— None —</option>
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.registrationNumber} ({v.capacity} seats)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>
                Start Point<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={startPoint}
                onChange={(e) => setStartPoint(e.target.value)}
                placeholder="Main Campus"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                End Point<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={endPoint}
                onChange={(e) => setEndPoint(e.target.value)}
                placeholder="Sector G-9 Markaz"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Distance (km)</label>
              <input
                type="number"
                min={0}
                step="0.1"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Est. Duration (min)</label>
              <input
                type="number"
                min={0}
                value={estimatedDurationMin}
                onChange={(e) => setEstimatedDurationMin(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                Base Fee (monthly)<span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                value={baseFee}
                onChange={(e) => setBaseFee(e.target.value)}
                placeholder="4500"
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className={sectionCls + ' mb-0'}>Stops</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {stops.length} stop{stops.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">#</th>
                  <th className="px-3 py-2 text-left font-semibold">Name</th>
                  <th className="px-3 py-2 text-left font-semibold">Pickup</th>
                  <th className="px-3 py-2 text-left font-semibold">Drop</th>
                  <th className="px-3 py-2 text-left font-semibold">Fee</th>
                  <th className="px-3 py-2 text-left font-semibold">Lat</th>
                  <th className="px-3 py-2 text-left font-semibold">Lng</th>
                  <th className="px-3 py-2 text-left font-semibold">Landmark</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {stops.map((s, i) => (
                  <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-2 py-2 w-16">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {s.sequence}
                        </span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => moveStop(i, -1)}
                            disabled={i === 0}
                            className="p-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-30"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveStop(i, 1)}
                            disabled={i === stops.length - 1}
                            className="p-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-30"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={s.name}
                        onChange={(e) => updateStop(i, { name: e.target.value })}
                        placeholder="Stop name"
                        className={inputCls}
                      />
                    </td>
                    <td className="px-2 py-2 w-28">
                      <input
                        type="time"
                        value={s.pickupTime}
                        onChange={(e) => updateStop(i, { pickupTime: e.target.value })}
                        className={inputCls}
                      />
                    </td>
                    <td className="px-2 py-2 w-28">
                      <input
                        type="time"
                        value={s.dropTime}
                        onChange={(e) => updateStop(i, { dropTime: e.target.value })}
                        className={inputCls}
                      />
                    </td>
                    <td className="px-2 py-2 w-24">
                      <input
                        type="number"
                        min={0}
                        value={s.fee}
                        onChange={(e) => updateStop(i, { fee: e.target.value })}
                        placeholder="—"
                        className={inputCls}
                      />
                    </td>
                    <td className="px-2 py-2 w-24">
                      <input
                        type="number"
                        step="any"
                        value={s.latitude}
                        onChange={(e) => updateStop(i, { latitude: e.target.value })}
                        className={inputCls}
                      />
                    </td>
                    <td className="px-2 py-2 w-24">
                      <input
                        type="number"
                        step="any"
                        value={s.longitude}
                        onChange={(e) => updateStop(i, { longitude: e.target.value })}
                        className={inputCls}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={s.landmark}
                        onChange={(e) => updateStop(i, { landmark: e.target.value })}
                        className={inputCls}
                      />
                    </td>
                    <td className="px-2 py-2 w-10">
                      <button
                        type="button"
                        onClick={() => removeStop(i)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addStop}
            className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-sm text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg border border-teal-200"
          >
            <Plus className="w-4 h-4" />
            Add Stop
          </button>
        </div>

        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>
    </Modal>
  );
}
