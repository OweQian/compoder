import { streamText } from "ai"
import { buildSystemPrompt, generateComponentMessage } from "./utils"
import {
  DesignProcessingWorkflowContext,
  GenerateProcessingWorkflowContext,
} from "../../type"

export const generateComponent = async (
  context: DesignProcessingWorkflowContext,
): Promise<GenerateProcessingWorkflowContext> => {
  context.stream.write("start call codegen-ai \n")

  let completion = ""

  // 构建系统提示词
  const systemPrompt = buildSystemPrompt(
    context.query.rules,
    context.state?.designTask?.retrievedAugmentationContent,
  )

  console.log("generate-component systemPrompt:", systemPrompt)

  // 构建用户提示词
  const messages = generateComponentMessage(context)

  const stream = await streamText({
    system: systemPrompt,
    model: context.query.aiModel,
    messages,
  })

  for await (const part of stream.textStream) {
    try {
      process.stdout.write(part || "")
      const chunk = part || ""
      completion += chunk
      context.stream.write(chunk)
    } catch (e) {
      console.error(e)
    }
  }

  context.stream.write("call codegen-ai end \n\n")

  // 返回生成代码
  return {
    ...context,
    state: {
      ...context.state,
      generatedCode: completion,
    },
  }
}
