import { Types } from "mongoose"
import { ComponentCodeModel } from "./schema"
import { ComponentCode, Prompt } from "./types"

export async function createComponentCode(params: {
  userId: string
  codegenId: string
  name: string
  description: string
  prompt: Prompt[]
  code: string
}) {
  const { userId, codegenId, name, description, prompt, code } = params

  const newComponent = await ComponentCodeModel.create({
    userId: new Types.ObjectId(userId),
    codegenId: new Types.ObjectId(codegenId),
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
    id: newComponent._id.toString(),
    ...newComponent.toObject()
  }
}

export async function updateComponentCode(params: {
  id: string
  prompt: Prompt[]
  code: string
}) {
  const { id, prompt, code } = params

  const updated = await ComponentCodeModel.findByIdAndUpdate(
    new Types.ObjectId(id),
    {
      $push: {
        versions: {
          code,
          prompt,
        },
      },
    },
    { new: true },
  ).lean<ComponentCode | null>()

  if (!updated) {
    throw new Error("Component not found")
  }

  return updated
}

export async function saveComponentCodeVersion(params: {
  id: string
  versionId: string
  code: string
}) {
  const { id, versionId, code } = params

  const updated = await ComponentCodeModel.findOneAndUpdate(
    {
      _id: new Types.ObjectId(id),
      "versions._id": new Types.ObjectId(versionId),
    },
    {
      $set: {
        "versions.$.code": code,
      },
    },
    { new: true },
  ).lean<ComponentCode | null>()

  if (!updated) {
    throw new Error("Component or version not found")
  }

  return updated
}

export async function deleteComponentCode(params: { id: string }) {
  const { id } = params

  const result = await ComponentCodeModel.deleteOne({
    _id: new Types.ObjectId(id),
  })

  if (result.deletedCount === 0) {
    throw new Error("Component not found")
  }
}
