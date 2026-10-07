import { redirect } from "next/navigation";

// The parent app opens on the login page.
export default function Home() {
  redirect("/signin");
}
