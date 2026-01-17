import { ComponentCodeModel } from "./schema"
import { Prompt, Version } from "./types"

// 创建组件代码
export async function createComponentCode({
  userId,
  codegenId,
  name,
  description,
  prompt,
  code,
}: {
  userId: string
  codegenId: string
  name: string
  description: string
  prompt: Prompt[]
  code: string
}) {
  try {
    // 组件代码入库
    const componentCode = await ComponentCodeModel.create({
      userId,
      codegenId,
      name,
      description,
      versions: [
        {
          code,
          prompt,
        },
      ],
    })

    return {
      _id: componentCode._id,
      ...componentCode.toObject(),
    }
  } catch (error) {
    console.error("Error creating component code:", error)
    throw error
  }
}

// 更新组件代码
export async function updateComponentCode({
  id,
  prompt,
  code,
}: {
  id: string
  prompt: Prompt[]
  code: string
}) {
  try {
    const componentCode = await ComponentCodeModel.findById(id)
    if (!componentCode) {
      throw new Error("Component code not found")
    }
    // 入库，将新的版本添加到组件代码中 - versions数组
    componentCode.versions.push({ prompt, code })
    await componentCode.save()
    return {
      _id: componentCode._id,
      ...componentCode.toObject(),
    }
  } catch (error) {
    console.error("Error updating component code:", error)
    throw error
  }
}

// 保存组件代码版本
export async function saveComponentCodeVersion({
  id,
  versionId,
  code,
}: {
  id: string
  versionId: string
  code: string
}) {
  try {
    const componentCode = await ComponentCodeModel.findById(id)
    if (!componentCode) {
      throw new Error("Component code not found")
    }

    const versionIndex = componentCode.versions.findIndex(
      (v: Version) => v._id.toString() === versionId,
    )
    if (versionIndex === -1) {
      throw new Error("Version not found")
    }

    componentCode.versions[versionIndex].code = code
    await componentCode.save()

    return {
      _id: componentCode._id,
      ...componentCode.toObject(),
    }
  } catch (error) {
    console.error("Error saving component code version:", error)
    throw error
  }
}

// 删除组件代码
export async function deleteComponentCode({ id }: { id: string }) {
  try {
    const result = await ComponentCodeModel.findByIdAndDelete(id)
    if (!result) {
      throw new Error("Component code not found")
    }
    return { success: true }
  } catch (error) {
    console.error("Error deleting component code:", error)
    throw error
  }
}
