import mongoose from "mongoose"
import { Codegen } from "./types"

// 代码生成器规则 Schema
const CodegenRuleSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      "public-components",
      "styles",
      "private-components",
      "file-structure",
      "attention-rules",
    ],
    required: true,
  },
  description: {
    type: String,
    default: "",
    required: true,
  },
  dataSet: {
    type: [String],
    default: undefined,
  },
  prompt: {
    type: String,
    default: undefined,
  },
  docs: {
    // only used when type is "private-components"
    type: Object,
    of: {
      type: Object,
      of: {
        description: String,
        api: String,
      },
    },
    default: undefined,
  },
})

// 代码生成器 Schema
const CodegenSchema = new mongoose.Schema<Codegen>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    fullStack: {
      type: String,
      enum: ["React", "Vue"],
      required: true,
    },
    guides: {
      type: [String],
      default: [],
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    codeRendererUrl: {
      type: String,
      required: true,
    },
    rules: {
      type: [CodegenRuleSchema],
      default: [],
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

// 代码生成器模型
export const CodegenModel =
  mongoose.models.Codegen || mongoose.model<Codegen>("Codegen", CodegenSchema)
