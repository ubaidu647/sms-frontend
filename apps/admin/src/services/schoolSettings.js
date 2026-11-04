// The signed-in school's own settings — today, the month its academic year
// starts in. GET is open to every user of the school; PATCH to its admin only.
import apiClient from '@/services/apiClient';

const unwrap = (res) => res.data; // envelope: { status, message, data }

const normalizeError = (error) => {
  throw new Error(error.response?.data?.message || error.message || 'Request failed');
};

export const getSchoolSettings = async () => {
  try {
    return unwrap(await apiClient.get('/schools/settings'));
  } catch (error) {
    return normalizeError(error);
  }
};

// `academicYearStartMonth`: 1–12, or null to follow the default again.
export const updateSchoolSettings = async (payload) => {
  try {
    return unwrap(await apiClient.patch('/schools/settings', payload));
  } catch (error) {
    return normalizeError(error);
  }
};
