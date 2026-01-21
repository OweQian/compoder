import { NextRequest, NextResponse } from "next/server"
import { ComponentCodeApi } from "../type"
import { validateSession } from "@/lib/auth/middleware"
import { connectToDatabase } from "@/lib/db/mongo"
import { findComponentCodes } from "@/lib/db/componentCode/selectors"

export async function GET(req: NextRequest) {
  try {
    const authError = await validateSession()
    if (authError) {
      return authError
    }

    await connectToDatabase()

    const searchParams = req.nextUrl.searchParams

    const params: ComponentCodeApi.listRequest = {
      codegenId: searchParams.get("codegenId") || "",
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: parseInt(searchParams.get("pageSize") || "10"),
      searchKeyword: searchParams.get("searchKeyword") || undefined,
      filterField:
        (searchParams.get(
          "filterField",
        ) as ComponentCodeApi.listRequest["filterField"]) || "all",
    }

    if (!params.codegenId) {
      return NextResponse.json(
        { error: "Missing required parameter: codegenId" },
        { status: 400 },
      )
    }

    if (isNaN(params.page) || params.page < 1) {
      return NextResponse.json(
        { error: "Invalid page parameter" },
        { status: 400 },
      )
    }

    if (isNaN(params.pageSize) || params.pageSize < 1) {
      return NextResponse.json(
        { error: "Invalid pageSize parameter" },
        { status: 400 },
      )
    }

    const result = await findComponentCodes(params)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Failed to fetch component codes:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}

export const dynamic = "force-dynamic"
