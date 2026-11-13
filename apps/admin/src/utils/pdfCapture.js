// html2canvas renders a clone of the page for the screen, so the print rules in
// globals.css do not reach it: the clone has to drop the dark theme itself.
export function forceLightTheme(clonedDocument) {
  clonedDocument.documentElement.classList.remove('dark');
}

export const PDF_CAPTURE_OPTIONS = {
  scale: 2,
  useCORS: true,
  backgroundColor: '#ffffff',
  onclone: forceLightTheme,
};

export const PDF_FAILED_MESSAGE = 'Could not create the PDF. Please try again.';
