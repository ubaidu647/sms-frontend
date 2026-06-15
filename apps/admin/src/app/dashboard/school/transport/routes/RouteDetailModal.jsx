'use client';
import React, { useMemo } from 'react';
import { Modal } from '@/component/Modal';
import { Bus, Compass, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';

const PIN_PALETTES = [
  {
    text: 'text-emerald-500',
    border: 'border-emerald-500',
    borderT: 'border-t-emerald-500',
    borderB: 'border-b-emerald-500',
  },
  {
    text: 'text-teal-700',
    border: 'border-teal-700',
    borderT: 'border-t-teal-700',
    borderB: 'border-b-teal-700',
  },
  {
    text: 'text-emerald-700',
    border: 'border-emerald-700',
    borderT: 'border-t-emerald-700',
    borderB: 'border-b-emerald-700',
  },
  {
    text: 'text-blue-600',
    border: 'border-blue-600',
    borderT: 'border-t-blue-600',
    borderB: 'border-b-blue-600',
  },
  {
    text: 'text-cyan-700',
    border: 'border-cyan-700',
    borderT: 'border-t-cyan-700',
    borderB: 'border-b-cyan-700',
  },
  {
    text: 'text-indigo-600',
    border: 'border-indigo-600',
    borderT: 'border-t-indigo-600',
    borderB: 'border-b-indigo-600',
  },
  {
    text: 'text-purple-600',
    border: 'border-purple-600',
    borderT: 'border-t-purple-600',
    borderB: 'border-b-purple-600',
  },
  {
    text: 'text-rose-500',
    border: 'border-rose-500',
    borderT: 'border-t-rose-500',
    borderB: 'border-b-rose-500',
  },
];

function InfoCell({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
        {value || '—'}
      </span>
    </div>
  );
}

export default function RouteDetailModal({ isOpen, onClose, route }) {
  const { accessToken: token } = useTokenStore();

  const populatedVehicle =
    route?.vehicleId && typeof route.vehicleId === 'object' ? route.vehicleId : null;
  const vehicleId =
    typeof route?.vehicleId === 'string' ? route.vehicleId : populatedVehicle?._id || '';

  const needsFullFetch =
    !!vehicleId &&
    (!populatedVehicle || !populatedVehicle.driver || !populatedVehicle.manufactureYear);

  const { data: vehicleData } = useQuery({
    queryKey: ['vehicle-detail', vehicleId],
    queryFn: () => fetchData({ url: `/transport/vehicle/${vehicleId}`, token }),
    enabled: !!token && isOpen && needsFullFetch,
    staleTime: 30000,
    retry: false,
  });

  const fetchedVehicle = vehicleData?.data || vehicleData || null;
  const vehicle = fetchedVehicle || populatedVehicle;

  const stops = useMemo(
    () => [...(route?.stops || [])].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)),
    [route],
  );

  const perStopDistance = stops.length ? Number(route?.distanceKm || 0) / stops.length : 0;

  if (!route) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Transport Route${route.name ? ` — ${route.name}` : ''}`}
      subtitle="Route details, vehicle, and stop sequence"
      size="xl"
    >
      <div className="space-y-8">
        {/* Vehicle / Driver header card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-[120px_1fr_1fr_1fr] gap-6 items-center">
            <div className="w-[120px] h-[80px] rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
              <Bus className="w-12 h-12 text-amber-500" />
            </div>

            <div className="space-y-3">
              <InfoCell label="Vehicle Number:" value={vehicle?.registrationNumber} />
              <InfoCell label="Driver Name" value={vehicle?.driver?.name} />
            </div>

            <div className="space-y-3">
              <InfoCell
                label="Vehicle Model"
                value={
                  vehicle
                    ? [vehicle.make, vehicle.modelName].filter(Boolean).join(' ') ||
                      vehicle.vehicleType
                    : ''
                }
              />
              <InfoCell label="Driver Licence" value={vehicle?.driver?.licenseNumber} />
            </div>

            <div className="space-y-3">
              <InfoCell label="Made" value={vehicle?.manufactureYear} />
              <InfoCell label="Driver Contact" value={vehicle?.driver?.phone} />
            </div>
          </div>
        </div>

        {/* Route summary line */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-700 dark:text-gray-300">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Path: </span>
            <span className="font-medium">{route.startPoint}</span>
            <span className="text-gray-400 dark:text-gray-500 mx-1">→</span>
            <span className="font-medium">{route.endPoint}</span>
          </div>
          {route.distanceKm != null && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">Total Distance: </span>
              <span className="font-medium">{route.distanceKm} km</span>
            </div>
          )}
          {route.estimatedDurationMin != null && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">Est. Duration: </span>
              <span className="font-medium">{route.estimatedDurationMin} min</span>
            </div>
          )}
          <div>
            <span className="text-gray-500 dark:text-gray-400">Stops: </span>
            <span className="font-medium">{stops.length}</span>
          </div>
        </div>

        {/* Winding road with stops */}
        <div className="relative bg-gradient-to-b from-gray-50 to-white border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-8 overflow-x-auto">
          {stops.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              No stops defined for this route.
            </p>
          ) : (
            <div
              className="relative"
              style={{
                minWidth: `${Math.max(stops.length * 180, 600)}px`,
                height: '380px',
              }}
            >
              {/* Winding road SVG */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 1000 380"
                preserveAspectRatio="none"
              >
                {(() => {
                  const amplitude = 70;
                  const midY = 190;
                  const segments = 60;
                  const points = [];
                  for (let i = 0; i <= segments; i++) {
                    const x = (i / segments) * 1000;
                    const phase = (i / segments) * Math.max(stops.length - 1, 1) * Math.PI;
                    const y = midY + Math.sin(phase) * amplitude;
                    points.push(`${i === 0 ? 'M' : 'L'}${x},${y}`);
                  }
                  const path = points.join(' ');
                  return (
                    <>
                      <path
                        d={path}
                        stroke="#374151"
                        strokeWidth="46"
                        fill="none"
                        strokeLinecap="round"
                      />
                      <path
                        d={path}
                        stroke="#fff"
                        strokeWidth="2"
                        strokeDasharray="10 10"
                        fill="none"
                      />
                    </>
                  );
                })()}
              </svg>

              {/* Stop pins positioned along the road */}
              {stops.map((stop, i) => {
                const palette = PIN_PALETTES[i % PIN_PALETTES.length];
                const xPct = stops.length === 1 ? 50 : 6 + (i / (stops.length - 1)) * 88;
                const isTop = i % 2 === 0;
                const distance = Number(stop.distanceKm ?? perStopDistance).toFixed(1);

                const pinFace = (
                  <div
                    className={`relative w-20 h-20 rounded-full border-[3px] ${palette.border} bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm`}
                  >
                    <MapPin className={`w-4 h-4 ${palette.text} absolute top-1.5 left-1.5`} />
                    <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 px-1 text-center leading-tight">
                      {stop.name || `Stop ${i + 1}`}
                    </span>
                  </div>
                );

                const meta = (
                  <div className="flex items-center gap-2 ml-16">
                    <Compass className={`w-7 h-7 ${palette.text}`} />
                    <div className="text-xs text-gray-700 dark:text-gray-300 leading-tight whitespace-nowrap">
                      <div>Distance (km): {distance}</div>
                      <div>Pickup time: {stop.pickupTime || '—'}</div>
                    </div>
                  </div>
                );

                return (
                  <div
                    key={stop._id || i}
                    className="absolute flex flex-col items-center"
                    style={{
                      left: `${xPct}%`,
                      top: isTop ? '0px' : '50%',
                      transform: 'translateX(-50%)',
                    }}
                  >
                    {isTop ? (
                      <>
                        <div className="flex flex-col items-center">
                          {pinFace}
                          <div
                            className={`w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px] ${palette.borderT}`}
                          />
                        </div>
                        <div className="mt-3">{meta}</div>
                      </>
                    ) : (
                      <>
                        <div className="mb-3">{meta}</div>
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[16px] ${palette.borderB}`}
                          />
                          {pinFace}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
