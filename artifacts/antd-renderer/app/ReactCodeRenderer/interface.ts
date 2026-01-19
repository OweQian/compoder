export interface DynamicComponentRendererProps {
  // 代码文件内容
  files: { [key: string]: string }
  // 入口文件
  entryFile: string
  // 外部依赖
  customRequire: (importPath: string) => any
  // 错误处理
  onError: (errorMessage: string) => void
  // 成功处理
  onSuccess: () => void
}

export interface ModuleCache {
  [key: string]: {
    exports: any
  }
}

export interface ExportsObject {
  [key: string]: any
}
