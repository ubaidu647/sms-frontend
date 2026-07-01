'use client';
// Ready-made hooks wrapping the WhatsApp integration API:
//   useWhatsAppSettings() — load + save the branch settings doc
//   useWhatsAppSession()   — drive the unofficial (Baileys) QR connect flow
//
// The session hook prefers Socket.IO for live QR/status (the server refreshes the
// QR ~every 20s) and falls back to polling GET /session/status every 3s whenever
// the socket isn't connected. Events are emitted globally, so we filter by branch.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import {
  getMySettings,
  upsertSettings,
  connectSession,
  getSessionStatus,
  logoutSession,
} from '@/services/whatsapp';

// Socket.IO lives on the API origin (default namespace), not under the /api path.
const API_ORIGIN = (() => {
  const raw = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';
  try {
    return new URL(raw).origin;
  } catch {
    return raw.replace(/\/api\/?$/, '');
  }
})();

const SETTINGS_KEY = ['whatsapp', 'settings', 'me'];

export function useWhatsAppSettings({ enabled = true } = {}) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: getMySettings,
    enabled,
  });

  const raw = query.data?.data ?? null;
  const isMultiBranch = Array.isArray(raw);

  const save = useMutation({
    mutationFn: upsertSettings,
    onSuccess: (res) => {
      toast.success(res?.message || 'WhatsApp settings saved');
      // The upsert returns the merged doc — refetch to keep every branch in sync.
      qc.invalidateQueries({ queryKey: SETTINGS_KEY });
    },
    onError: (err) => toast.error(err.message || 'Failed to save settings'),
  });

  return {
    settings: isMultiBranch ? null : raw,
    branches: isMultiBranch ? raw : null,
    isMultiBranch,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    save: save.mutateAsync,
    saving: save.isPending,
  };
}

const POLL_MS = 3000;
const LIVE = ['disconnected', 'connecting', 'connected', 'logged-out'];

// `branchId`       — sent to the API (org admin only; omit for branch users).
// `filterBranchId` — the branch these socket events belong to (always known:
//                    the selected branch for org admins, the user's own branch
//                    for branch-scoped users). Used to filter the global emits.
export function useWhatsAppSession({ branchId, filterBranchId, enabled = true } = {}) {
  const [status, setStatus] = useState('disconnected');
  const [qr, setQr] = useState(null);
  const [connectedNumber, setConnectedNumber] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);
  const socketRef = useRef(null);
  const socketLive = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const applyStatus = useCallback((data) => {
    if (!data) return null;
    if (LIVE.includes(data.status)) setStatus(data.status);
    if (data.status === 'connected') {
      setQr(null);
      if (data.connectedNumber) setConnectedNumber(data.connectedNumber);
      return 'connected';
    }
    setQr(data.qr || null);
    if (data.connectedNumber) setConnectedNumber(data.connectedNumber);
    if (data.status === 'logged-out') return 'logged-out';
    return null;
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      const res = await getSessionStatus(branchId);
      return applyStatus(res?.data);
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [branchId, applyStatus]);

  // Polling is the fallback — it no-ops while the socket is delivering events.
  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      if (socketLive.current) return; // socket is healthy — skip the HTTP poll
      const terminal = await refreshStatus();
      if (terminal === 'connected') stopPolling();
    }, POLL_MS);
  }, [refreshStatus, stopPolling]);

  const connect = useCallback(async () => {
    setError(null);
    setConnecting(true);
    setStatus('connecting');
    try {
      const res = await connectSession(branchId);
      applyStatus(res?.data);
      startPolling(); // fallback in case sockets aren't reachable
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Failed to start WhatsApp session');
      setStatus('disconnected');
    } finally {
      setConnecting(false);
    }
  }, [branchId, applyStatus, startPolling]);

  const logout = useCallback(async () => {
    stopPolling();
    try {
      await logoutSession(branchId);
      setStatus('logged-out');
      setQr(null);
      setConnectedNumber(null);
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Failed to disconnect');
    }
  }, [branchId, stopPolling]);

  // Live updates via Socket.IO, filtered to this branch. Events are emitted
  // globally, so we compare the payload's branchId against filterBranchId. When
  // filterBranchId is unknown we accept the event rather than drop it silently.
  useEffect(() => {
    if (!enabled) return undefined;
    const mine = (bId) => !filterBranchId || !bId || String(bId) === String(filterBranchId);

    const socket = io(API_ORIGIN, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socketLive.current = true;
    });
    socket.on('disconnect', () => {
      socketLive.current = false;
    });
    socket.on('connect_error', () => {
      socketLive.current = false; // fall back to polling
    });
    socket.on('whatsapp:qr', ({ branchId: bId, qr: nextQr }) => {
      if (mine(bId)) setQr(nextQr || null);
    });
    socket.on('whatsapp:status', ({ branchId: bId, status: nextStatus, connectedNumber: num }) => {
      if (!mine(bId)) return;
      applyStatus({ status: nextStatus, connectedNumber: num });
    });

    return () => {
      socketLive.current = false;
      socket.off();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, filterBranchId, applyStatus]);

  // Load the current status once when the screen mounts / branch changes.
  useEffect(() => {
    if (!enabled) return undefined;
    refreshStatus();
    return stopPolling;
  }, [enabled, branchId, refreshStatus, stopPolling]);

  return { status, qr, connectedNumber, connecting, error, connect, logout, refreshStatus };
}
