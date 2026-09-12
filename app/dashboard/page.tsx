"use client"
import { useSession, signIn, signOut } from "next-auth/react"
import { useEffect, useState } from "react"

type Repo = {
  id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  default_branch: string
  html_url: string
  language: string | null
  updated_at: string
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const [repos, setRepos] = useState<Repo[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [deploying, setDeploying] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null)

  useEffect(() => {
    if (session) {
      setLoading(true)
      fetch("/api/repos")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setRepos(data)
        })
        .finally(() => setLoading(false))
    }
  }, [session])

  const filtered = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.full_name.toLowerCase().includes(search.toLowerCase())
  )

  const handleDeploy = async (repo: Repo) => {
    setDeploying(repo.full_name)
    setToast(null)
    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoFullName: repo.full_name,
          branch: repo.default_branch,
        }),
      })
      const data = await res.json()
      if (data.url) {
        setToast({ msg: `Deploy sukses! https://${data.url}`, type: "ok" })
      } else {
        setToast({ msg: `Gagal: ${data.error}`, type: "err" })
      }
    } catch (e: any) {
      setToast({ msg: `Error: ${e.message}`, type: "err" })
    } finally {
      setDeploying(null)
    }
  }

  if (status === "loading") return <p style={{ padding: 40 }}>Loading...</p>

  if (!session) {
    return (
      <div style={{ padding: 40 }}>
        <h1>Login dulu bos</h1>
        <button
          onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
          style={{
            background: "#000",
            color: "#fff",
            padding: "0.75rem 1.5rem",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            marginTop: 16,
          }}
        >
          Sign in with GitHub
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: "bold" }}>📦 Dashboard</h1>
        <button
          onClick={() => signOut()}
          style={{ background: "transparent", border: "1px solid #ccc", padding: "0.5rem 1rem", borderRadius: 6, cursor: "pointer" }}
        >
          Logout ({session.user?.name})
        </button>
      </div>

      <input
        type="text"
        placeholder="🔍 Cari repository..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "0.75rem 1rem",
          border: "1px solid #ddd",
          borderRadius: 8,
          marginBottom: 16,
          fontSize: "1rem",
        }}
      />

      {toast && (
        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: 8,
            marginBottom: 16,
            background: toast.type === "ok" ? "#dcfce7" : "#fee2e2",
            color: toast.type === "ok" ? "#166534" : "#991b1b",
            fontSize: "0.9rem",
            wordBreak: "break-all",
          }}
        >
          {toast.msg}
        </div>
      )}

      {loading ? (
        <p>Loading repo...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "#666" }}>Nggak ada repo yang cocok.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((repo) => (
            <div
              key={repo.id}
              style={{
                border: "1px solid #eee",
                borderRadius: 10,
                padding: "1rem 1.25rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h3 style={{ fontWeight: 600, fontSize: "1rem", margin: 0 }}>
                    {repo.name}
                  </h3>
                  {repo.private && (
                    <span style={{ fontSize: "0.7rem", background: "#fef3c7", color: "#92400e", padding: "2px 6px", borderRadius: 4 }}>
                      private
                    </span>
                  )}
                  {repo.language && (
                    <span style={{ fontSize: "0.75rem", color: "#666" }}>
                      {repo.language}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "0.85rem", color: "#666", margin: "4px 0 0" }}>
                  {repo.description || "Tanpa deskripsi"}
                </p>
              </div>
              <button
                onClick={() => handleDeploy(repo)}
                disabled={deploying === repo.full_name}
                style={{
                  background: deploying === repo.full_name ? "#93c5fd" : "#2563eb",
                  color: "#fff",
                  padding: "0.5rem 1rem",
                  borderRadius: 8,
                  border: "none",
                  cursor: deploying === repo.full_name ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                  whiteSpace: "nowrap",
                }}
              >
                {deploying === repo.full_name ? "Deploying..." : "Deploy 🚀"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
