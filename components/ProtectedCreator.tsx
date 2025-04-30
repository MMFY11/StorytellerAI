"use client"
import { ReactNode } from "react"
import { useSession, signIn } from "next-auth/react"

export interface ProtectedCreatorProps {
  children: ReactNode
}

export default function ProtectedCreator({ children }: ProtectedCreatorProps) {
  const { data: session, status } = useSession()
  if (status === "loading") return null
  if (!session) {
    return (
      <div className="p-10 text-center">
        <p>Please login as a creator to write stories.</p>
        <button
          onClick={() => signIn("credentials")}
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
        >
          Login
        </button>
      </div>
    )
  }
  if (session.user.role !== "creator") {
    return (
      <div className="p-10 text-center">
        <p>You must be a creator to access this area.</p>
      </div>
    )
  }
  return <>{children}</>
}
