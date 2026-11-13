// Public certificate verification: no login, no dashboard chrome.
export const metadata = {
  title: "Verify certificate — Mizenzo School Management",
  description: "Check whether a school certificate is genuine.",
  robots: { index: false, follow: false },
};

export default function VerifyLayout({ children }) {
  return children;
}
