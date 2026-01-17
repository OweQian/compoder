import { CodegenModel } from "./schema"
import { Codegen } from "./types"

// 创建代码生成器
export async function createCodegen(codegen: Codegen | Codegen[]) {
  await CodegenModel.create(codegen)
}

// 更新代码生成器
export async function upsertCodegen(codegen: Codegen) {
  const result = await CodegenModel.findOneAndUpdate(
    { title: codegen.title },
    codegen,
    { upsert: true, new: true },
  )
  return result
}

// 批量更新代码生成器
export async function upsertCodegens(codegens: Codegen[]) {
  const results = await Promise.all(
    codegens.map(async codegen => {
      return await upsertCodegen(codegen)
    }),
  )
  return results
}
