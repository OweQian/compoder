import mongoose from "mongoose"
import { ComponentCode, Prompt, Version } from "./types"

const PromptSchema = new mongoose.Schema<Prompt>(
  {
    type: {
      type: String,
      enum: ["text", "image"],
      required: true,
    },
    text: {
      type: String,
      required: function () {
        return (this as unknown as Prompt).type === "text"
      },
    },
    image: {
      type: String,
      required: function () {
        return (this as unknown as Prompt).type === "image"
      },
    },
  },
  { _id: false },
)

const VersionSchema = new mongoose.Schema<Version>(
  {
    code: {
      type: String,
      required: true,
    },
    prompt: {
      type: [PromptSchema],
      required: true,
      default: [],
    },
  },
  { _id: true },
)

const ComponentCodeSchema = new mongoose.Schema<ComponentCode>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    codegenId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    versions: {
      type: [VersionSchema],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
  },
)

export const ComponentCodeModel =
  mongoose.models.ComponentCode ||
  mongoose.model<ComponentCode>("ComponentCode", ComponentCodeSchema)
