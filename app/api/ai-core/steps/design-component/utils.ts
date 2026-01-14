import { streamText, CoreMessage } from "ai"
import { WorkflowContext } from "../../type"
import {
  getPrivateComponentDocs,
  getPrivateDocsDescription,
} from "../../utils/codegenRules"
import { z } from "zod"

export interface ComponentDesign {
  // 组件名称
  componentName: string
  // 组件描述
  componentDescription: string
  // 组件库
  library: Array<{
    // 库名称
    name: string
    // 可能用到的组件列表
    components: string[]
    // 组件描述，拼接为字符串
    description: string
  }>
  // 私有组件库召回内容
  retrievedAugmentationContent?: string
}

const buildSystemPrompt = (rules: WorkflowContext["query"]["rules"]) => {
  // 获取组件文档描述
  const componentsDescription = getPrivateDocsDescription(rules)
  // 检查是否存在组件库
  const hasComponentLibraries = !!componentsDescription

  // create prompt parts for different situations
  const promptParts = {
    withLibraries: {
      goal: 'Extract the "basic component materials", component name, and description information needed to develop business components from business requirements and design drafts.',
      constraints: `Basic component materials include:
    ${componentsDescription}
    Please note: You should not provide example code and any other text in your response, only provider json response.`,
      responseFormat: `{
      "componentName": string, // Component name
      "componentDescription": string, // Component description
      "library": [ // Libraries containing required base material components
        {
          "name": string, // Library name
          "components": string[], // Components name in the library
          "description": string // Describe how each component in components is used in a table format
        }
      ]
    }`,
      workflowStep2:
        "2. Extract required materials from [Constraints] basic component materials for developing business components",
    },
    withoutLibraries: {
      goal: "Extract component name and description information needed to develop business components from business requirements and design drafts.",
      constraints: `- Extract the component name and description information from the business requirements and design drafts. 
- Analyze the design draft to understand the business functionality needed.

Please note: You should not provide example code and any other text in your response, only provider json response.`,
      responseFormat: `{
      "componentName": string, // Component name
      "componentDescription": string // Component description that clearly explains the purpose and functionality
    }`,
      workflowStep2:
        "2. Analyze the business requirements and design drafts to identify needed business components and their functions",
    },
  }

  // select the prompt part for the corresponding situation
  const parts = hasComponentLibraries
    ? promptParts.withLibraries
    : promptParts.withoutLibraries

  // build the workflow steps
  // 构建工作流步骤
  const workflowSteps = `1. Accept user's business requirements or design draft images
    ${parts.workflowStep2}
    3. Generate and return the JSON response in the specified format`

  // build the final prompt
  // 构建最终提示词
  return `
    # You are a senior frontend engineer who excels at developing business components.
    
    ## Goal
    ${parts.goal}
    
    ## Constraints
    ${parts.constraints}
    
    ## Response Format
    You must respond with a JSON object in the following format:
    ${parts.responseFormat}
    
    ## Workflow
    ${workflowSteps}
  `
}

// When component exists, build corresponding user message and assistant message
const buildCurrentComponentMessage = (
  component: WorkflowContext["query"]["component"],
): Array<CoreMessage> => {
  // 当组件存在时，构建对应的用户消息和助手消息(版本迭代时使用)
  return component
    ? [
        {
          role: "user",
          content:
            component?.prompt?.map(prompt => {
              if (prompt.type === "image") {
                return { type: "image" as const, image: prompt.image }
              }
              return { type: "text" as const, text: prompt.text }
            }) || [],
        },
        {
          role: "assistant",
          content: `
        - Component name: ${component?.name}
        - Component code:
        ${component?.code}
      `,
        },
      ]
    : []
}

// Build user message
const buildUserMessage = (
  prompt: WorkflowContext["query"]["prompt"],
): Array<CoreMessage> => {
  // 构建用户消息
  return [
    {
      role: "user",
      content: prompt.map(p => {
        if (p.type === "image") {
          return { type: "image" as const, image: p.image }
        }
        return { type: "text" as const, text: p.text }
      }),
    },
  ]
}

// get the api of the components in the library
export function getRetrievedAugmentationContent(
  docs: ReturnType<typeof getPrivateComponentDocs>,
  library?: ComponentDesign["library"],
): string {
  if (!library) {
    return ``
  }

  const templates: string[] = []

  for (const param of library) {
    const namespace = param.name
    const componentsList = param?.components
    const components = docs?.[namespace]

    if (components) {
      let componentDescriptions = ""

      for (const componentName of componentsList) {
        const component = components[componentName]
        if (component) {
          componentDescriptions += `
${componentName}: ${component.api}
`
        }
      }

      const template = `
The following content describes the usage of components in the ${namespace} library
---------------------
${componentDescriptions.trim()}
---------------------
`
      templates.push(template.trim())
    }
  }

  return templates.join("\n\n")
}

export async function generateComponentDesign(
  req: WorkflowContext,
): Promise<ComponentDesign> {
  const componentsSchema = z.object({
    componentName: z.string().describe("Component name"),
    componentDescription: z.string().describe("Component description"),
    library: z.array(
      z.object({
        name: z.string().describe("Library name"),
        components: z
          .array(z.string())
          .describe("Components name in the library"),
        description: z
          .string()
          .describe(
            "Describe how each component in components is used in a table format",
          ),
      }),
    ),
  })

  let parserCompletion: ComponentDesign = {
    componentName: "componentName",
    componentDescription: "componentDescription",
    library: [],
  }
  // 构建系统提示词
  const systemPrompt = buildSystemPrompt(req.query.rules)

  console.log("design-component systemPrompt:", systemPrompt)
  const messages = [
    ...buildCurrentComponentMessage(req.query.component),
    ...buildUserMessage(req.query.prompt),
  ]

  console.log("design-component messages:", messages)

  try {
    const stream = await streamText({
      system: systemPrompt,
      model: req.query.aiModel,
      messages,
    })

    let accumulatedJson = ""

    for await (const part of stream.textStream) {
      // 写入流
      req.stream.write(part)
      // 累加 JSON
      accumulatedJson += part
    }

    try {
      if (!accumulatedJson) {
        throw new Error(
          "No response from the AI, please check the providers configuration and the apiKey balance",
        )
      }
      // Try to extract JSON from the response
      const jsonMatch = accumulatedJson.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("No valid JSON found in the response")
      }

      console.log("jsonMatch", jsonMatch[0])

      // Fix backticks in the JSON string by replacing them with escaped double quotes
      let jsonString = jsonMatch[0]

      // 1. Handle existing escape characters first
      jsonString = jsonString.replace(/\\`/g, "\\\\`")

      // 2. Process content wrapped in backticks
      jsonString = jsonString.replace(
        /`((?:[^`\\]|\\.|\\`)*)`/g, // More precise regular expression
        function (match, content) {
          // Handle special characters
          const escaped = content
            .replace(/\\/g, "\\\\") // Handle backslashes first
            .replace(/"/g, '\\"') // Handle double quotes
            .replace(/\n/g, "\\n") // Handle newlines
            .replace(/\r/g, "\\r") // Handle carriage returns
            .replace(/\t/g, "\\t") // Handle tabs
          return `"${escaped}"`
        },
      )

      const parsedJson = JSON.parse(jsonString)

      console.log("parsedJson", parsedJson)

      // Validate the parsed JSON against our schema
      const validatedResult = componentsSchema.parse(parsedJson)
      parserCompletion = validatedResult
    } catch (parseError) {
      throw new Error(
        `Failed to parse AI response as valid JSON: ${parseError}`,
      )
    }

    if (parserCompletion.library.length > 0) {
      // 获取私有组件文档
      const docs = getPrivateComponentDocs(req.query.rules)
      // 获取组件库内容
      parserCompletion.retrievedAugmentationContent =
        getRetrievedAugmentationContent(docs, parserCompletion.library)
    }

    console.log("parserCompletion", parserCompletion)
    return parserCompletion
  } catch (err: unknown) {
    console.log("err", err)
    if (err instanceof Error) {
      throw err
    }
    throw new Error(String(err))
  }
}
