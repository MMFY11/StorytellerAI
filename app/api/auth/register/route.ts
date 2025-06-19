import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  const { name, email, password, role } = await request.json();

  // 1) Missing‑fields guard
  if (!name || !email || !password || !role) {
    return NextResponse.json(
      { error: "Missing fields" },
      { status: 400 }
    );
  }

  // ← Add here: enforce valid email format
  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  // 2) Enforce minimum password length
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters long." },
      { status: 400 }
    );
  }

  // 3) Check duplicate email
  const [existing]: any = await pool.query(
    "SELECT id FROM users WHERE email = ?",
    [email]
  );
  if (Array.isArray(existing) && existing.length) {
    return NextResponse.json(
      { error: "Email already in use" },
      { status: 409 }
    );
  }

  // 4) Hash & insert
  const passwordHash = await bcrypt.hash(password, 10);
  await pool.query(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    [name, email, passwordHash, role]
  );

  return NextResponse.json(
    { success: true },
    { status: 201 }
  );
}
