export interface CodegenRule {
  type:
    | "public-components"
    | "styles"
    | "private-components"
    | "file-structure"
    | "attention-rules"
  description: string
  prompt?: string // only used when type is "styles" | "file-structure" | "attention-attention"
  dataSet?: string[] // only used when type is "public-components"
  docs?: {
    // only used when type is "private-components"
    [libraryName: string]: {
      [componentName: string]: {
        description: string
        api: string
      }
    }
  }
}

export interface Codegen {
  // 标题
  title: string
  // 描述
  description: string
  // 技术栈
  fullStack: "React" | "Vue"
  // 指南 - 快速提示词，用于快速生成组件
  guides: string[]
  // 模型
  model: string
  // 代码渲染器 URL
  codeRendererUrl: string
  // 规则
  rules: CodegenRule[]
}
