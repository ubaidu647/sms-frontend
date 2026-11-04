'use client';
import { useEffect, useState } from 'react';
import apiClient from '@/services/apiClient';
import {
  academicYearUser,
  setAcademicYearUser,
  setSchoolAcademicYearStartMonth,
  startMonthFromSettings,
} from '@/utils/academicYear';

// One request per signed-in user per page load, shared by every caller.
let loadedFor = null;
let inFlight = null;
const SETTINGS_WAIT_MS = 8000;

function loadFor(userKey) {
  // A sign-out in between clears the active user, so signing back in reloads.
  if (loadedFor === userKey && inFlight && academicYearUser() === userKey) return inFlight;
  loadedFor = userKey;
  // The remembered month is per user: a different user never inherits it.
  setAcademicYearUser(userKey);
  // Never hold the dashboard on a loader for a slow network: after the wait it
  // renders with the remembered (or default) month.
  const giveUp = new Promise((resolve) => {
    setTimeout(resolve, SETTINGS_WAIT_MS);
  });
  const request = apiClient
    .get('/schools/settings', { skipLogoutRedirect: true })
    .then((res) => {
      if (academicYearUser() !== userKey) return; // signed out / switched user meanwhile
      // The month the API itself uses, so client and server never disagree.
      setSchoolAcademicYearStartMonth(startMonthFromSettings(res.data?.data));
    })
    .catch((err) => {
      // A user with no school (platform admin) gets 403: follow the default.
      // Anything else (offline, 5xx): keep the last remembered month.
      if (err.response?.status === 403 && academicYearUser() === userKey) {
        setSchoolAcademicYearStartMonth(null);
      }
    });
  inFlight = Promise.race([request, giveUp]);
  return inFlight;
}

/**
 * Load the school's settings (academic year start month) once the user is
 * known, before the dashboard renders: forms and filters compute "the current
 * academic year" when they mount, so the month must already be in place.
 * Never blocks for good — a failed request falls back to the remembered or
 * default month.
 */
export function useSchoolSettings(userKey) {
  const [readyFor, setReadyFor] = useState(null);

  useEffect(() => {
    if (!userKey) return undefined;
    let live = true;
    loadFor(userKey).finally(() => {
      if (live) setReadyFor(userKey);
    });
    return () => {
      live = false;
    };
  }, [userKey]);

  return { ready: !userKey || readyFor === userKey };
}
