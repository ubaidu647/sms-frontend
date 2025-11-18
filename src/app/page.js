import Image from "next/image";

export default function Home() {
  return (
    <div>
      <h1>Chat App</h1>
      <a href="/auth/signin">Login</a>
      <a href="/register">Register</a>
    </div>
  );
}
