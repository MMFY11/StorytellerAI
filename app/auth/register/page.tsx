"use client";
import { useState }   from "react";
import { useRouter }  from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [role, setRole]         = useState<"reader" | "creator">("reader");
  const [error, setError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role })
    });
    if (res.ok) {
      router.push("/auth/login");
    } else {
      const data = await res.json();
      setError(data.error || "Registration failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-4">Create an Account</h1>
        {error && <p className="text-red-500 mb-2">{error}</p>}

        <label className="block mb-2">Name</label>
        <input
          className="w-full p-2 border rounded mb-4"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />

        <label className="block mb-2">Email</label>
        <input
          type="email"
          required
          pattern="^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$"
          title="Please enter a valid email (e.g. you@example.com or you@example.co)"
          className="w-full p-2 border rounded mb-4"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />


        <label className="block mb-2">Password</label>
        <input
          type="password"
          minLength={6}
          className="w-full p-2 border rounded mb-4"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        <label className="block mb-2">Confirm Password</label>
        <input
          type="password"
          minLength={6}
          className="w-full p-2 border rounded mb-4"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
        />

        <label className="block mb-2">I am a…</label>
        <select
          className="w-full p-2 border rounded mb-6"
          value={role}
          onChange={e => setRole(e.target.value as "reader"|"creator")}
        >
          <option value="reader">Reader</option>
          <option value="creator">Creator</option>
        </select>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded"
        >
          Register
        </button>
      </form>
    </div>
  );
}
