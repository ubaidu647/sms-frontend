// Pure helper: announcement attachments as safe links. Only http(s) URLs are
// kept — a javascript: or data: URL must never become a clickable href.

/** The URL as a string when it is absolute http or https, else null. */
export function safeHttpUrl(value) {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

/** [{ key, name, href }] for each attachment with a safe URL; others are dropped. */
export function attachmentLinks(attachments) {
  if (!Array.isArray(attachments)) return [];
  return attachments.flatMap((att, i) => {
    const href = safeHttpUrl(att?.url);
    if (!href) return [];
    const name =
      (typeof att.name === "string" && att.name.trim()) || "Attachment";
    return [{ key: att._id ? String(att._id) : String(i), name, href }];
  });
}
