import { useInfiniteQuery, QueryKey, useQuery } from "@tanstack/react-query"
import {
  getCodegenList,
  getCodegenDetail,
} from "@/app/services/codegen/codegen.service"
import { CodegenApi } from "@/app/api/codegen/types"
import { JobItem } from "@/components/biz/CodegenList/interface"
import {
  getComponentCodeDetail,
  getComponentCodeList,
} from "@/app/services/componentCode/componentCode.service"
import { ComponentCodeApi } from "@/app/api/componentCode/type"
import { ComponentItem } from "@/components/biz/ComponentCodeList/interface"
import { transformComponentArtifactFromXml } from "@/lib/xml-message-parser/parser"

export const useGetCodegenList = (
  params: Omit<CodegenApi.ListRequest, "page">,
) => {
  return useInfiniteQuery<
    CodegenApi.ListResponse,
    Error,
    {
      data: JobItem[]
      total: number
    },
    QueryKey,
    number
  >({
    queryKey: ["getCodegenList", params],
    initialPageParam: 1,
    queryFn: ({ pageParam }: { pageParam: number }) =>
      getCodegenList({ ...params, page: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      const totalPages = Math.ceil(lastPage.total / (params.pageSize || 10))
      const nextPage = allPages.length + 1
      return nextPage <= totalPages ? nextPage : undefined
    },
    select: data => ({
      data: data.pages.flatMap(page =>
        page.data.map(item => ({
          id: String(item._id),
          title: item.title,
          description: item.description,
          fullStack: item.fullStack,
        })),
      ),
      total: data.pages[0]?.total ?? 0,
    }),
  })
}

export const useComponentCodeDetail = (id: string, codegenId: string) => {
  return useQuery<
    ComponentCodeApi.detailResponse,
    Error,
    ComponentCodeApi.detailResponse["data"]
  >({
    queryKey: ["componentCodeDetail", id],
    queryFn: () => getComponentCodeDetail({ id, codegenId }),
    select: response => response.data,
    staleTime: 0,
  })
}

export const useGetCodegenDetail = (id: string) => {
  return useQuery<
    CodegenApi.DetailResponse,
    Error,
    CodegenApi.DetailResponse["data"]
  >({
    queryKey: ["codegenDetail", id],
    queryFn: () => getCodegenDetail({ id }),
    select: response => response.data,
    enabled: !!id,
  })
}

export const useGetComponentCodeList = (
  params: ComponentCodeApi.listRequest,
) => {
  return useQuery<
    ComponentCodeApi.listResponse,
    Error,
    {
      data: ComponentItem[]
      total: number
    }
  >({
    queryKey: ["componentCodeList", params],
    queryFn: () => getComponentCodeList(params),
    select: response => ({
      data: response.data.map(item => {
        // Parse the latestVersionCode to extract component information
        let codes: Record<string, string> = {}
        let entryFile = "App.tsx"
        const title = item.name
        const description = item.description

        try {
          const parsed = transformComponentArtifactFromXml(
            item.latestVersionCode,
          )
          codes = parsed.codes
          entryFile = parsed.entryFile || "App.tsx"
        } catch (error) {
          console.error("Error parsing component code:", error)
          // Fallback to default structure
          codes = { "App.tsx": item.latestVersionCode || "" }
        }

        return {
          id: String(item._id),
          title,
          description,
          code: codes,
          entryFile,
        }
      }),
      total: response.total,
    }),
  })
}
