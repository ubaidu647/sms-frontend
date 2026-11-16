import { Sora } from "next/font/google";

// The landing page's heading font, for the sign-in pages' headings.
const heading = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

export default function AuthLayout({ children }) {
  return <div className={heading.variable}>{children}</div>;
}
