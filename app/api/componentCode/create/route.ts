import { NextResponse } from "next/server"
import { ComponentCodeApi } from "../type"
import { validateSession, getUserId } from "@/lib/auth/middleware"
import { connectToDatabase } from "@/lib/db/mongo"
import { findCodegenById } from "@/lib/db/codegen/selectors"
import { getAIClient } from "@/app/api/ai-core/utils/aiClient"
import { run } from "@/app/api/ai-core/workflow"
import type { AIProvider } from "@/lib/config/ai-providers"
import { LanguageModel } from "ai"

export async function POST(req: Request) {
  const authError = await validateSession()
  if (authError) {
    return authError
  }

  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized - user not found" },
      { status: 401 },
    )
  }

  try {
    const body = (await req.json()) as ComponentCodeApi.createRequest
    const { codegenId, prompt, model, provider } = body

    if (!codegenId || !prompt || !model || !provider) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      )
    }

    await connectToDatabase()

    const codegen = await findCodegenById(codegenId)
    const aiModel = getAIClient(provider as AIProvider, model)

    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()
    const encoder = new TextEncoder()

    run({
      stream: {
        write: chunk => writer.write(encoder.encode(chunk)),
        close: () => writer.close(),
      },
      query: {
        prompt,
        aiModel: aiModel as LanguageModel,
        rules: codegen.rules || [],
        userId,
        codegenId,
      },
    }).catch(error => {
      writer.write(encoder.encode(String(error)))
      writer.close()
    })

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    })
  } catch (error) {
    console.error("Failed to create component code:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}

export const dynamic = "force-dynamic"
