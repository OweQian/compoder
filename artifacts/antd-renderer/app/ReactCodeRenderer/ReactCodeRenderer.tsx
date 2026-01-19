/**
 * ReactCodeRenderer - 动态 React 组件渲染器
 *
 * 该组件用于在运行时动态加载、编译和执行 React 组件代码。
 * 主要功能包括：
 * 1. 使用 Babel 将 TypeScript/JSX 代码转换为可执行的 JavaScript
 * 2. 实现模块系统，支持文件间的导入导出
 * 3. 处理外部依赖库的导入（如 antd、react 等）
 * 4. 提供完善的错误处理和提示机制
 * 5. 模块缓存机制，避免重复编译
 */

import React, { useEffect, useState } from "react"
import { transform } from "@babel/standalone"
import path from "path-browserify"
import { ErrorDisplay } from "./ErrorDisplay"
import { ErrorBoundary } from "./ErrorBoundary"
import {
  DynamicComponentRendererProps,
  ModuleCache,
  ExportsObject,
} from "./interface"

/**
 * 全局类型声明
 * 用于在 window 对象上存储模块导入映射关系，便于错误追踪和调试
 */
declare global {
  interface Window {
    _moduleImportMap: {
      [importPath: string]: {
        importingFile: string // 导入该模块的文件路径
        importedModule: string // 被导入的模块路径
      }
    }
  }
}

/**
 * DynamicComponentRenderer - 动态组件渲染器主组件
 *
 * @param files - 文件映射对象，key 为文件路径，value 为文件内容
 * @param entryFile - 入口文件路径，该文件应该导出一个默认的 React 组件
 * @param customRequire - 自定义 require 函数，用于加载外部依赖库
 * @param onError - 错误回调函数，当解析或渲染出错时调用
 * @param onSuccess - 成功回调函数，当组件成功解析时调用
 */
const DynamicComponentRenderer: React.FC<DynamicComponentRendererProps> = ({
  files,
  entryFile,
  customRequire,
  onError,
  onSuccess,
}) => {
  // 存储解析后的 React 组件
  const [Component, setComponent] = useState<React.ComponentType | null>(null)
  // 存储错误信息
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    /**
     * 模块缓存对象
     * 用于缓存已编译的模块，避免重复编译同一文件
     */
    const modules: ModuleCache = {}

    /**
     * processFile - 处理单个文件，将其编译并执行
     *
     * 该函数实现了类似 Node.js 的模块系统：
     * 1. 检查模块是否已缓存，如果已缓存则直接返回
     * 2. 使用 Babel 将代码转换为 CommonJS 格式
     * 3. 创建模块执行环境（require, module, exports 等）
     * 4. 执行转换后的代码
     * 5. 缓存模块并返回导出对象
     *
     * @param filename - 要处理的文件路径
     * @returns 模块的导出对象
     */
    const processFile = (filename: string): any => {
      // 如果模块已缓存，直接返回缓存的导出对象，避免重复编译
      if (modules[filename]) {
        return modules[filename].exports
      }

      // 从文件映射中获取文件代码内容
      const code = files[filename]

      // 如果文件不存在，抛出明确的错误信息
      if (!code) {
        throw new Error(`File not found: ${filename}`)
      }

      /**
       * 使用 Babel 转换代码
       * - presets: 使用 react、env、typescript 预设来处理 JSX、ES6+ 和 TypeScript 语法
       * - plugins: 使用 transform-modules-commonjs 将 ES6 模块转换为 CommonJS 格式
       */
      const transformedCode = transform(code, {
        filename,
        presets: ["react", "env", "typescript"],
        plugins: ["transform-modules-commonjs"],
      }).code

      // 创建模块的导出对象和模块对象
      const exports: ExportsObject = {}
      const myModule = { exports }

      /**
       * 创建可执行的函数模块
       * 使用 Function 构造函数创建函数，该函数接收 CommonJS 模块系统的参数：
       * - require: 用于导入其他模块的函数
       * - module: 当前模块对象
       * - exports: 模块导出对象
       * - __filename: 当前文件路径
       * - React: React 库的引用
       */
      const ComponentModule = new Function(
        "require",
        "module",
        "exports",
        "__filename",
        "React",
        transformedCode!,
      )

      /**
       * 执行模块代码，传入自定义的 require 函数
       * 这个 require 函数实现了模块解析逻辑
       */
      ComponentModule(
        /**
         * 自定义 require 函数 - 处理模块导入
         *
         * 该函数实现了两种类型的导入：
         * 1. 相对路径导入（以 . 开头）：从当前文件所在目录解析
         * 2. 绝对路径导入：作为外部依赖库处理
         *
         * @param importPath - 导入路径（如 "./Component" 或 "antd"）
         * @returns 导入的模块对象
         */
        (importPath: string) => {
          /**
           * 解析导入路径
           * - 相对路径（以 . 开头）：基于当前文件所在目录解析
           * - 绝对路径：保持原样，作为外部依赖处理
           */
          const resolvedPath = importPath.startsWith(".")
            ? path.join(path.dirname(filename), importPath).replace(/^\//, "")
            : importPath

          /**
           * 生成可能的文件路径列表
           * 支持多种文件扩展名和目录索引文件的查找：
           * - 原始路径
           * - 添加 .ts 扩展名
           * - 添加 .tsx 扩展名
           * - 目录下的 index.ts
           * - 目录下的 index.tsx
           * - 移除已有扩展名
           */
          const possiblePaths = [
            resolvedPath,
            resolvedPath + ".ts",
            resolvedPath + ".tsx",
            resolvedPath + "/index.ts",
            resolvedPath + "/index.tsx",
            resolvedPath.replace(/\.(ts|tsx)$/, ""),
          ]

          // 在文件映射中查找匹配的文件路径
          const normalizedPath = Object.keys(files).find(file =>
            possiblePaths.includes(file),
          )

          // 如果找到了匹配的内部文件，递归处理该文件
          if (normalizedPath) {
            try {
              const result = processFile(normalizedPath)

              /**
               * 验证模块导出是否有效
               * 检查导出对象是否为空或未定义
               */
              if (
                result === undefined ||
                (typeof result === "object" &&
                  Object.keys(result).length === 0 &&
                  !result.default)
              ) {
                throw new Error(
                  `Module "${importPath}" imported in "${filename}" doesn't have any exports. Make sure you've correctly exported components/functions from this module.`,
                )
              }

              return result
            } catch (error) {
              // 包装错误信息，添加上下文信息
              if (error instanceof Error) {
                throw new Error(
                  `Error while processing import "${importPath}" in "${filename}": ${error.message}`,
                )
              }
              throw error
            }
          }

          /**
           * 处理外部依赖库导入（如 antd、react、lodash 等）
           * 这些库通过 customRequire 函数加载
           */
          try {
            // 使用自定义 require 函数加载外部模块
            const externalModule = customRequire(importPath)

            /**
             * 记录模块导入映射关系
             * 用于错误追踪和调试，帮助定位导入问题
             */
            const importRecord = {
              importingFile: filename, // 哪个文件导入了该模块
              importedModule: importPath, // 导入的模块路径
            }

            // 将导入记录存储到全局对象中
            if (!window._moduleImportMap) {
              window._moduleImportMap = {}
            }
            window._moduleImportMap[importPath] = importRecord

            /**
             * 使用 Proxy 包装外部模块，增强错误处理
             *
             * 当访问模块属性时，Proxy 会：
             * 1. 检查属性是否存在
             * 2. 检查属性值是否为 undefined
             * 3. 提供友好的错误提示（包括相似名称建议）
             * 4. 列出所有可用的组件/属性
             */
            return new Proxy(externalModule, {
              get: (target, prop) => {
                // 排除 Symbol 类型和私有属性（以 _ 开头）
                // 这些属性通常用于内部实现，不需要特殊处理
                if (
                  typeof prop === "symbol" ||
                  prop.toString().startsWith("_")
                ) {
                  return target[prop]
                }

                // 检查属性是否存在于目标对象中
                if (prop in target) {
                  const value = target[prop]

                  /**
                   * 检查属性值是否为 undefined
                   * 即使属性存在，如果值为 undefined，可能是打包或导出问题
                   * 注意：default 属性允许为 undefined（某些库可能这样设计）
                   */
                  if (value === undefined && prop !== "default") {
                    throw new Error(
                      `Component "${String(
                        prop,
                      )}" exists in module "${importPath}" but its value is undefined. This may indicate a packaging or export issue with the module.`,
                    )
                  }

                  return value
                }

                /**
                 * 智能错误提示：尝试找到相似的组件名
                 * 通过比较大小写不敏感的名称和去除特殊字符后的名称来匹配
                 * 这有助于用户发现拼写错误或命名差异
                 */
                const keys = Object.keys(target)
                const similarNames = keys.filter(
                  k =>
                    k.toLowerCase() === String(prop).toLowerCase() ||
                    k.replace(/[_-]/g, "") ===
                      String(prop).replace(/[_-]/g, ""),
                )

                // 如果找到相似的名称，提供建议
                if (similarNames.length > 0) {
                  const suggestions = similarNames.join(", ")
                  throw new Error(
                    `Component "${String(
                      prop,
                    )}" does not exist in module "${importPath}". Did you mean: ${suggestions}?`,
                  )
                }

                /**
                 * 如果找不到相似的名称，列出所有可用的组件/属性
                 * 帮助用户了解该模块实际导出了什么
                 */
                throw new Error(
                  `Component "${String(
                    prop,
                  )}" does not exist in module "${importPath}". Available components are: ${Object.keys(
                    target,
                  ).join(", ")}.`,
                )
              },
            })
          } catch (error) {
            /**
             * 处理外部库加载错误
             * 如果错误信息已经是我们的自定义错误（包含 "does not exist in module"），
             * 直接传递；否则包装错误信息
             */
            if (error instanceof Error) {
              // 如果错误信息已经是我们的自定义错误，直接传递
              if (error.message.includes("does not exist in module")) {
                throw error
              }
              throw new Error(
                `Error loading external module "${importPath}": ${error.message}`,
              )
            }
            throw error
          }
        },
        myModule, // 当前模块对象
        exports, // 模块导出对象
        filename, // 当前文件路径
        require("react"), // React 库的引用
      )

      // 将编译后的模块缓存起来
      modules[filename] = myModule
      // 返回模块的导出对象
      return myModule.exports
    }

    /**
     * parseComponents - 解析入口文件并提取默认导出的组件
     *
     * 该函数是组件解析的主流程：
     * 1. 处理入口文件，编译并执行所有依赖
     * 2. 从入口文件的导出中获取默认组件
     * 3. 验证组件是否存在
     * 4. 设置组件状态并触发成功回调
     * 5. 处理各种错误情况并提供友好的错误信息
     */
    const parseComponents = async () => {
      try {
        // 清除之前的错误状态
        setError(null)

        // 处理入口文件，这会递归处理所有依赖
        processFile(entryFile)

        // 从入口文件的导出中获取默认组件
        const exportedComponent = modules[entryFile].exports.default

        // 验证默认导出是否存在
        if (!exportedComponent) {
          const errorMsg = `Component not found: The default export from "${entryFile}" is undefined. Please check if you've correctly exported your component with "export default YourComponent".`
          setError(errorMsg)
          onError(errorMsg)
          return
        }

        // 使用函数式更新，确保组件正确设置
        setComponent(() => exportedComponent)
        // 触发成功回调
        onSuccess()
      } catch (error: any) {
        console.error("parseComponents error:", error)

        /**
         * 增强错误信息处理
         * 通过正则表达式匹配不同类型的错误，提供更友好的错误提示
         */

        // 匹配 React 的未定义组件错误（通常是忘记导出组件导致的）
        const undefinedComponentMatch = error.message.match(
          /type is invalid.*?but got: undefined.*?You likely forgot to export/i,
        )

        // 匹配我们的自定义错误（组件不存在于模块中）
        const missingComponentMatch = error.message.match(
          /Component "([^"]+)" does not exist in module "([^"]+)"/,
        )

        if (missingComponentMatch) {
          /**
           * 如果是我们的自定义错误（组件不存在），直接使用该错误信息
           * 这些错误信息已经包含了足够的上下文和提示
           */
          setError(error.message)
          onError(error.message)
        } else if (undefinedComponentMatch) {
          /**
           * 如果是 React 的未定义组件错误，尝试从错误堆栈中提取更多信息
           * 这有助于用户定位问题
           */

          // 从错误堆栈中提取组件名称
          const componentNameMatch = error.stack?.match(/at ([A-Za-z0-9_]+) \(/)
          const componentName = componentNameMatch
            ? componentNameMatch[1]
            : "Unknown"

          // 从错误堆栈中提取可能的导入源
          const importSourceMatch = error.stack?.match(/from ['"]([^'"]+)['"]/)
          const importSource = importSourceMatch
            ? importSourceMatch[1]
            : "a module"

          // 生成增强的错误信息
          const enhancedErrorMsg = `Missing component error: The component "${componentName}" being rendered is undefined. This often happens when you import a non-existent component (e.g., from ${importSource}). Please check your imports and make sure all components exist in their respective packages.`
          setError(enhancedErrorMsg)
          onError(enhancedErrorMsg)
        } else {
          /**
           * 其他类型的错误，使用通用错误格式
           * 保留原始错误信息，但添加前缀以便识别
           */
          setError("parse component error: " + error.message)
          onError("parse component error: " + error.message)
        }
      }
    }

    // 执行组件解析
    parseComponents()
  }, [files, entryFile, customRequire, onError])

  /**
   * 渲染逻辑
   *
   * 1. 如果有错误，显示错误信息
   * 2. 如果组件还未加载，返回 null（不渲染任何内容）
   * 3. 如果组件已加载，使用 ErrorBoundary 包裹组件进行渲染
   */

  // 如果有错误，显示错误信息组件
  if (error) {
    return <ErrorDisplay errorMessage={error} />
  }

  // 如果组件还未加载完成，不渲染任何内容
  if (!Component) {
    return null
  }

  /**
   * 使用 ErrorBoundary 包裹组件
   * 这样可以捕获组件运行时错误，并提供友好的错误显示
   */
  return (
    <ErrorBoundary onError={onError} files={files}>
      <Component />
    </ErrorBoundary>
  )
}

export default DynamicComponentRenderer
