import { FilterQuery, Types } from "mongoose"
import { ComponentCodeModel } from "./schema"
import { ComponentCode } from "./types"
import { ComponentCodeApi } from "@/app/api/componentCode/type"
import { getCodeRendererUrl } from "../codegen/selectors"

export async function findComponentCodes(
  params: ComponentCodeApi.listRequest,
) {
  const { codegenId, page, pageSize, searchKeyword, filterField = "all" } =
    params

  const query: FilterQuery<ComponentCode> = {
    codegenId: new Types.ObjectId(codegenId),
  }

  if (searchKeyword) {
    const regex = { $regex: searchKeyword, $options: "i" }
    if (filterField === "name") {
      query.name = regex
    } else if (filterField === "description") {
      query.description = regex
    } else {
      query.$or = [{ name: regex }, { description: regex }]
    }
  }

  const skip = (page - 1) * pageSize

  const [data, total] = await Promise.all([
    ComponentCodeModel.find(query)
      .select("_id name description versions updatedAt createdAt")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    ComponentCodeModel.countDocuments(query),
  ])

  const formatted = data.map(item => {
    const latestVersion = item.versions[item.versions.length - 1]
    return {
      _id: item._id,
      name: item.name,
      description: item.description,
      latestVersionCode: latestVersion?.code || "",
    }
  })

  return { data: formatted, total }
}

export async function findComponentCodeDetail(params: {
  id: string
  codegenId: string
}) {
  const { id, codegenId } = params

  const component = await ComponentCodeModel.findOne({
    _id: new Types.ObjectId(id),
    codegenId: new Types.ObjectId(codegenId),
  })
    .select("_id name description versions")
    .lean<
      Pick<ComponentCode, "_id" | "name" | "description" | "versions"> & {
        _id: Types.ObjectId
      }
    >()

  if (!component) {
    throw new Error("Component not found")
  }

  const codeRendererUrl = await getCodeRendererUrl(codegenId)

  return {
    ...component,
    codeRendererUrl: codeRendererUrl || "",
  }
}
