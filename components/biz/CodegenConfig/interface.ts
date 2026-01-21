import { Codegen, CodegenRule } from "@/lib/db/codegen/types"

export interface CodegenConfigProps {
  /** 初始化的 Codegen 数据，用于编辑模式 */
  initialData?: Partial<Codegen>
  /** 表单数据变化时的回调 */
  onChange?: (data: Partial<Codegen>) => void
  /** 表单提交时的回调，包含验证后的完整 Codegen 数据 */
  onSubmit?: (data: Codegen) => void
  /** 取消操作时的回调 */
  onCancel?: () => void
  /** 自定义类名 */
  className?: string
}

export type { Codegen, CodegenRule }
