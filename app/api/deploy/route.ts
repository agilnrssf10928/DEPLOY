import { auth } from "@/auth"

export async function POST(req: Request) {
  const session = await auth()
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { repoFullName, branch } = await req.json()

  if (!repoFullName || !repoFullName.includes("/")) {
    return Response.json({ error: "Format repo invalid" }, { status: 400 })
  }

  const VERCEL_TOKEN = process.env.DEPLOY_VERCEL_TOKEN
  if (!VERCEL_TOKEN) {
    return Response.json({ error: "Server salah config (DEPLOY_VERCEL_TOKEN belum di-set)" }, { status: 500 })
  }

  const [owner, repoName] = repoFullName.split("/")
  const projectName = `${repoName}-${Math.random().toString(36).slice(2, 8)}`.toLowerCase()

  try {
    // 1. Bikin project di Vercel
    const projectRes = await fetch("https://api.vercel.com/v11/projects", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: projectName,
        gitRepository: {
          repo: repoFullName,
          type: "github",
        },
      }),
    })

    const project = await projectRes.json()

    if (!projectRes.ok) {
      return Response.json(
        { error: project.error?.message || "Gagal bikin project" },
        { status: 400 }
      )
    }

    // 2. Trigger deployment
    const deployRes = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: project.name,
        project: project.id,
        target: "production",
        gitSource: {
          type: "github",
          repoId: project.link?.repoId,
          ref: branch || "main",
        },
      }),
    })

    const deployment = await deployRes.json()

    if (!deployRes.ok) {
      return Response.json(
        { error: deployment.error?.message || "Gagal deploy" },
        { status: 400 }
      )
    }

    return Response.json({
      success: true,
      url: deployment.url,
      id: deployment.id,
      inspectorUrl: deployment.inspectorUrl,
    })
  } catch (err: any) {
    return Response.json({ error: err.message || "Server error" }, { status: 500 })
  }
}
