export const PRINT_READY_TIMEOUT_MS = 5000;

// Resolves once the page's fonts and images are ready, or after the timeout: a
// slow or broken image must not stop the print. Never rejects.
export async function waitForPrintAssets(doc, timeoutMs = PRINT_READY_TIMEOUT_MS) {
  // A font starts loading only once layout uses it, so force layout first;
  // otherwise fonts.ready can resolve before the Urdu font has been requested.
  void doc.body?.offsetHeight;
  const assets = [doc.fonts?.ready, ...Array.from(doc.images || [], (img) => img.decode?.())].map(
    (p) => Promise.resolve(p).catch(() => {}),
  );

  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(resolve, timeoutMs);
  });
  await Promise.race([Promise.all(assets), timeout]);
  clearTimeout(timer);
}
