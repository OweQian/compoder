import { Types } from "mongoose"

// 提示词文本
export type PromptText = {
  type: "text"
  text: string
}

// 提示词图片
export type PromptImage = {
  type: "image"
  image: string
}

export type Prompt = PromptText | PromptImage

export type Version = {
  // 主键
  _id: Types.ObjectId
  // 代码
  code: string
  // 提示词
  prompt: Prompt[]
}

export interface ComponentCode {
  // 主键
  _id: Types.ObjectId
  // 用户 ID
  userId: Types.ObjectId
  // 代码生成器 ID
  codegenId: Types.ObjectId
  // 组件名称
  name: string
  // 组件描述
  description: string
  // 版本列表
  versions: Version[]
}
