import { NextResponse } from "next/server"
import { ComponentCodeApi } from "../type"
import { validateSession } from "@/lib/auth/middleware"
import { connectToDatabase } from "@/lib/db/mongo"
import { saveComponentCodeVersion } from "@/lib/db/componentCode/mutations"

export async function POST(req: Request) {
  try {
    const authError = await validateSession()
    if (authError) {
      return authError
    }

    const body = (await req.json()) as ComponentCodeApi.saveRequest
    const { id, versionId, code } = body

    if (!id || !versionId || !code) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      )
    }

    await connectToDatabase()
    await saveComponentCodeVersion({ id, versionId, code })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to save component code version:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}

export const dynamic = "force-dynamic"
