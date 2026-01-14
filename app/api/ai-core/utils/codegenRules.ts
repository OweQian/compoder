import { CodegenRule } from "@/lib/db/codegen/types"

const IMPORTANT_NOTE = `Important: Write the code directly inside each ComponentFile tag. Do NOT use any code block markers (like \`\`\`tsx, \`\`\`ts, etc.) inside the XML tags.

When modifying existing component code, only return the <ComponentFile> nodes that need to be modified, without returning unchanged files. However, for each modified <ComponentFile> node, you must include the complete code content of that file, even if only a small portion was modified. This ensures the system correctly replaces the entire file content and maintains code integrity.

`

const defaultFileStructure = `${IMPORTANT_NOTE}Output component code in XML format as follows:
<ComponentArtifact name="ComponentName">
  <ComponentFile fileName="App.tsx" isEntryFile="true">
    import { ComponentName } from './ComponentName';
    
    const mockProps = {
      // Define mock data here
    };
    
    export default function App() {
      return <ComponentName {...mockProps} />;
    }
  </ComponentFile>
  
  <ComponentFile fileName="[ComponentName].tsx">
    // Main component implementation
    // Split into multiple files if exceeds 500 lines
    export const ComponentName = () => {
      // Component implementation
    }
  </ComponentFile>

  <ComponentFile fileName="helpers.ts">
    // Helper functions (optional)
  </ComponentFile>

  <ComponentFile fileName="interface.ts">
    // Type definitions for component props
    // All API-interacting data must be defined as props:
    // - initialData for component initialization
    // - onChange, onSave, onDelete etc. for data modifications
  </ComponentFile>
</ComponentArtifact>
`

const defaultStyles = `
Use tailwindcss to write styles
`

const defaultAdditionalRules = `
- Ensure component is fully responsive across all device sizes
- Implement proper accessibility (ARIA) attributes
- Add comprehensive PropTypes or TypeScript interfaces
- Include error handling for all async operations
- Optimize rendering performance where possible
`

export function getPublicComponentsRule(rules: CodegenRule[]) {
  return rules.find(rule => rule.type === "public-components")?.dataSet
}

export function getStylesRule(rules: CodegenRule[]) {
  return rules.find(rule => rule.type === "styles")?.prompt ?? defaultStyles
}

export function getPrivateComponentDocs(rules: CodegenRule[]) {
  return rules.find(rule => rule.type === "private-components")?.docs
}

export function getPrivateDocsDescription(rules: CodegenRule[]): string {
  // 获取私有组件文档 -- docs
  const docs = getPrivateComponentDocs(rules)
  // 获取公共组件库 -- dataSet
  const publicLibraryComponents = getPublicComponentsRule(rules)

  // 检查公共组件库是否有效且非空
  const isPublicLibraryValid = (components: string[] | undefined): boolean => {
    return !!components && Array.isArray(components) && components.length > 0
  }

  // 检查私有组件库是否有效且非空
  const isPrivateLibraryValid = (
    docs: Record<string, any> | undefined,
  ): boolean => {
    return !!docs && Object.keys(docs).length > 0
  }

  // 检查公共组件库是否有效且非空
  const hasPublicLibrary = isPublicLibraryValid(publicLibraryComponents)
  // 检查私有组件库是否有效且非空
  const hasPrivateLibrary = isPrivateLibraryValid(docs)

  // 当没有有效的组件库时，返回空字符串
  if (!hasPrivateLibrary && !hasPublicLibrary) {
    return ""
  }

  // 格式化公共组件库组件为字符串
  const formatPublicLibraryComponents = (
    components: string[] | undefined,
  ): string => {
    return components?.join(", ") || ""
  }

  // 当私有组件库为空但公共组件库存在时，返回公共组件库描述
  if (!hasPrivateLibrary) {
    return hasPublicLibrary
      ? `- All components in ${formatPublicLibraryComponents(
          publicLibraryComponents,
        )}`
      : ""
  }

  const templates: string[] = []

  // 添加公共组件库组件
  if (hasPublicLibrary) {
    templates.push(`
        - All components in ${formatPublicLibraryComponents(
          publicLibraryComponents,
        )}
      `)
  }

  // 处理私有组件库
  for (const namespace in docs) {
    if (docs.hasOwnProperty(namespace)) {
      const components = docs[namespace]
      // 组件描述
      let componentDescriptions = ""

      for (const key in components) {
        if (components.hasOwnProperty(key)) {
          const component = components[key]
          // 组件描述
          componentDescriptions += `
  ${key}: ${component.description}
  `
        }
      }

      // 模板
      const template = `
  - Components in ${namespace}, below are descriptions of ${namespace} components (can only use component names listed below)
  ---------------------
  ${componentDescriptions.trim()}
  ---------------------
  `
      // 添加模板
      templates.push(template.trim())
    }
  }

  // 返回模板
  return templates.join("\n\n")
}

export function getFileStructureRule(rules: CodegenRule[]) {
  const customPrompt = rules.find(
    rule => rule.type === "file-structure",
  )?.prompt
  if (customPrompt) {
    return IMPORTANT_NOTE + customPrompt
  }
  return defaultFileStructure
}

export function getSpecialAttentionRules(rules: CodegenRule[]) {
  return (
    rules.find(rule => rule.type === "attention-rules")?.prompt ??
    defaultAdditionalRules
  )
}
