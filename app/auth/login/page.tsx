"use client";
import { useState } from "react";
import { signIn }  from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await signIn("credentials", {
      redirect: false,
      email, password,
    });
    if (res?.error) {
      setError(res.error);
    } else {
      // if creator, send to /stories or /my-stories
      router.push("/");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-4">Log In</h1>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <label className="block mb-2">Email</label>
        <input
          type="email"
          className="w-full p-2 border rounded mb-4"
          value={email} onChange={e => setEmail(e.target.value)}
          required
        />
        <label className="block mb-2">Password</label>
        <input
          type="password"
          className="w-full p-2 border rounded mb-6"
          value={password} onChange={e => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-green-600 text-white p-2 rounded"
        >
          Log In
        </button>
      </form>
    </div>
  );
}
