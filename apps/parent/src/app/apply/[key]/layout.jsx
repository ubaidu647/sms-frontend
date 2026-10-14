// Public admission enquiry form: no login, no dashboard chrome.
export const metadata = {
  title: "Admission enquiry — NodeCampus",
  description: "Submit an admission enquiry to the school.",
  robots: { index: false, follow: false },
};

export default function ApplyLayout({ children }) {
  return children;
}
