export const SOCIAL_NETWORKS = [
  'facebook',
  'twitter',
  'instagram',
  'linkedin',
  'youtube',
];

export const IMAGE_FIELDS = ['logo', 'stamp', 'letterhead', 'signature'];

export const HEX_COLOR_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
export const URL_RE = /^https?:\/\/.+/i;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateProfile(profile) {
  if (!profile.displayName?.trim()) return 'Display name is required';
  if (profile.printEmail && !EMAIL_RE.test(profile.printEmail))
    return 'Invalid printEmail format';
  if (profile.principal?.email && !EMAIL_RE.test(profile.principal.email))
    return 'Invalid principal.email format';
  if (profile.website && !URL_RE.test(profile.website))
    return 'website must start with http:// or https://';
  if (profile.primaryColor && !HEX_COLOR_RE.test(profile.primaryColor))
    return 'primaryColor must be a hex like "#0066cc"';
  if (profile.secondaryColor && !HEX_COLOR_RE.test(profile.secondaryColor))
    return 'secondaryColor must be a hex like "#0066cc"';
  return null;
}

function guessMimeFromUri(uri) {
  const ext = uri.split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'pdf') return 'application/pdf';
  return 'application/octet-stream';
}

function fileFromPickerAsset(asset, fallbackName) {
  if (!asset) return null;
  const uri = asset.uri;
  const name = asset.fileName || `${fallbackName}.jpg`;
  const type = asset.mimeType || guessMimeFromUri(uri);
  return { uri, name, type };
}

export function buildUpsertFormData(profile, files, branchId) {
  const fd = new FormData();
  fd.append('displayName', profile.displayName);
  if (branchId) fd.append('branchId', branchId);

  const scalars = [
    'tagline',
    'printAddress',
    'printPhone',
    'printEmail',
    'website',
    'primaryColor',
    'secondaryColor',
    'registrationNumber',
    'taxId',
  ];
  for (const key of scalars) {
    const v = profile[key];
    if (v !== undefined && v !== null && v !== '') fd.append(key, v);
  }

  const principal = profile.principal || {};
  const hasPrincipalData = ['name', 'designation', 'email', 'phone'].some(
    (k) => principal[k],
  );
  if (hasPrincipalData) {
    fd.append(
      'principal',
      JSON.stringify({
        name: principal.name || '',
        designation: principal.designation || '',
        email: principal.email || '',
        phone: principal.phone || '',
      }),
    );
  }

  const social = profile.socialLinks || {};
  const hasSocialData = SOCIAL_NETWORKS.some((n) => social[n]);
  if (hasSocialData) fd.append('socialLinks', JSON.stringify(social));

  if (profile.status) fd.append('status', profile.status);

  for (const field of IMAGE_FIELDS) {
    const asset = files?.[field];
    if (!asset) continue;
    const file = fileFromPickerAsset(asset, field);
    if (file) fd.append(field, file);
  }
  return fd;
}
