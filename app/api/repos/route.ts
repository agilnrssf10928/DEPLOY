
import { auth } from "@/auth"

export async function GET() {
  const session = await auth()

  // @ts-ignore
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  // @ts-ignore
  const res = await fetch(
    "https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator",
    {
      headers: {
        // @ts-ignore
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
      cache: "no-store",
    }
  )

  if (!res.ok) {
    return Response.json({ error: "Gagal ambil repo" }, { status: res.status })
  }

  const repos = await res.json()

  const simplified = repos.map((r: any) => ({
    id: r.id,
    name: r.name,
    full_name: r.full_name,
    description: r.description,
    private: r.private,
    default_branch: r.default_branch,
    html_url: r.html_url,
    language: r.language,
    updated_at: r.updated_at,
  }))

  return Response.json(simplified)
}
