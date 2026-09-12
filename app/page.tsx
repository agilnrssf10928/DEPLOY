"use client"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) router.push("/dashboard")
  }, [session, router])

  return (
    <main style={{ padding: "4rem", maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
        🚀 Deployer App
      </h1>
      <p style={{ marginBottom: "2rem", color: "#666" }}>
        Login pakai GitHub, pilih repository, klik deploy. Beres.
      </p>
      {status === "loading" ? (
        <p>Loading...</p>
      ) : (
        <button
          onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
          style={{
            background: "#000",
            color: "#fff",
            padding: "0.75rem 1.5rem",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          Sign in with GitHub
        </button>
      )}
    </main>
  )
}
