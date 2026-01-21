import { NextRequest, NextResponse } from "next/server"
import { validateSession } from "@/lib/auth/middleware"
import { connectToDatabase } from "@/lib/db/mongo"
import { findComponentCodeDetail } from "@/lib/db/componentCode/selectors"

export async function GET(req: NextRequest) {
  try {
    const authError = await validateSession()
    if (authError) {
      return authError
    }

    await connectToDatabase()

    const searchParams = req.nextUrl.searchParams
    const id = searchParams.get("id")
    const codegenId = searchParams.get("codegenId")

    if (!id || !codegenId) {
      return NextResponse.json(
        { error: "Missing required parameters: id and codegenId" },
        { status: 400 },
      )
    }

    const detail = await findComponentCodeDetail({ id, codegenId })

    return NextResponse.json({ data: detail })
  } catch (error) {
    console.error("Failed to fetch component code detail:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}

export const dynamic = "force-dynamic"
