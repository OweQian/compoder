"use client"
import { AppHeader } from "@/components/biz/AppHeader"
import { ChatInput } from "@/components/biz/ChatInput"
import { CodegenGuide } from "@/components/biz/CodegenGuide"
import { ComponentCodeFilterContainer } from "@/components/biz/ComponentCodeFilterContainer"
import { ComponentCodeList } from "@/components/biz/ComponentCodeList"
import { TldrawEdit } from "@/components/biz/TldrawEdit"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  useGetCodegenDetail,
  useGetComponentCodeList,
} from "../server-store/selectors"
import {
  useCreateComponentCode,
  useDeleteComponentCode,
} from "../server-store/mutations"
import { Prompt } from "@/lib/db/componentCode/types"
import {
  transformTryCatchErrorFromXml,
  transformNewComponentIdFromXml,
} from "@/lib/xml-message-parser/parser"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useFirstLoading } from "@/hooks/use-first-loading"
import { AIProvider } from "@/lib/config/ai-providers"
import {
  LLMSelectorProvider,
  LLMSelectorButton,
} from "@/app/commons/LLMSelectorProvider"

export default function CodegenPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const codegenId = params.codegenId as string

  // State management
  const [images, setImages] = useState<string[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const [provider, setProvider] = useState<AIProvider>()
  const [model, setModel] = useState<string>()
  const [currentPage, setCurrentPage] = useState(1)
  const [searchKeyword, setSearchKeyword] = useState("")
  const [filterField, setFilterField] = useState<"all" | "name" | "description">(
    "all",
  )
  const pageSize = 10

  // Fetch codegen detail
  const {
    data: codegenDetail,
    isLoading: isLoadingCodegen,
  } = useGetCodegenDetail(codegenId)

  // Fetch component code list
  const {
    data: componentListData,
    isLoading: isLoadingComponents,
    refetch: refetchComponents,
  } = useGetComponentCodeList({
    codegenId,
    page: currentPage,
    pageSize,
    searchKeyword: searchKeyword || undefined,
    filterField: filterField !== "all" ? filterField : undefined,
  })

  // Mutations
  const createMutation = useCreateComponentCode()
  const deleteMutation = useDeleteComponentCode()

  const isLoading = isLoadingCodegen || isLoadingComponents
  const isFirstLoading = useFirstLoading(isLoading)

  // Handle LLM change
  const handleLLMChange = (
    newProvider: AIProvider | undefined,
    newModel: string | undefined,
  ) => {
    setProvider(newProvider)
    setModel(newModel)
  }

  // Handle chat submit (create component)
  const handleChatSubmit = async (input?: string) => {
    if (!codegenId) return

    if (!provider || !model) {
      toast({
        title: "Error",
        description: "Please select a model and provider",
        variant: "default",
      })
      return
    }

    const prompt: Prompt[] = [
      ...(images.length > 0
        ? images.map(image => ({ type: "image" as const, image }))
        : []),
      {
        type: "text" as const,
        text: input || chatInput,
      },
    ]

    try {
      setIsSubmitting(true)
      const res = await createMutation.mutateAsync({
        codegenId,
        prompt,
        model,
        provider,
      })

      const reader = res?.getReader()
      const decoder = new TextDecoder()
      let content = ""

      while (true) {
        const { done, value } = await reader?.read()
        if (done) break
        content += decoder.decode(value)
        setStreamingContent(content)
      }

      // Check for errors
      const errorMessage = transformTryCatchErrorFromXml(content)
      if (errorMessage) {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
        return
      }

      // Extract new component ID and navigate
      const newComponentId = transformNewComponentIdFromXml(content)
      if (newComponentId) {
        toast({
          title: "Success",
          description: "Component created successfully",
        })
        // Navigate to the new component page
        router.push(`/main/codegen/${codegenId}/${newComponentId}`)
      } else {
        // Refresh the list if no component ID found (fallback)
        refetchComponents()
      }

      setImages([])
      setChatInput("")
    } catch (error) {
      console.error("Failed to create component:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create component",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setStreamingContent("")
    }
  }

  // Handle component item click
  const handleItemClick = (id: string) => {
    router.push(`/main/codegen/${codegenId}/${id}`)
  }

  // Handle component delete
  const handleDeleteClick = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id })
      refetchComponents()
    } catch (error) {
      console.error("Failed to delete component:", error)
    }
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Handle search change
  const handleSearchChange = (keyword: string) => {
    setSearchKeyword(keyword)
    setCurrentPage(1) // Reset to first page when searching
  }

  // Handle filter field change
  const handleFilterFieldChange = (field: "all" | "name" | "description") => {
    setFilterField(field)
    setCurrentPage(1) // Reset to first page when filtering
  }

  // Prepare prompts for CodegenGuide
  const prompts = codegenDetail?.guides?.map(guide => ({
    title: guide,
    onClick: () => {
      setChatInput(guide)
    },
  })) || []

  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: "Codegen", href: "/main/codegen" },
          { label: codegenDetail?.title || "Codegen Detail" },
        ]}
      />
      <ScrollArea className="h-[calc(100vh-100px)]">
        <LLMSelectorProvider onChange={handleLLMChange}>
          <CodegenGuide
            prompts={prompts}
            name={codegenDetail?.title || "Codegen"}
          />
          <div className="w-full max-w-4xl mx-auto mt-10">
            <div className="flex justify-end mb-2">
              <LLMSelectorButton />
            </div>
            <ChatInput
              loading={isSubmitting}
              value={isSubmitting ? streamingContent || "Processing your request..." : chatInput}
              onChange={setChatInput}
              actions={[
                <TldrawEdit
                  key="tldraw-edit"
                  onSubmit={(imageData) => {
                    setImages(prev => [...prev, imageData])
                  }}
                />,
              ]}
              images={images}
              onImageRemove={(index) => {
                setImages(prev => prev.filter((_, i) => i !== index))
              }}
              onSubmit={handleChatSubmit}
              disabled={isSubmitting || !provider || !model}
            />
          </div>
          <ComponentCodeFilterContainer
            pageSize={pageSize}
            total={componentListData?.total || 0}
            currentPage={currentPage}
            searchKeyword={searchKeyword}
            filterField={filterField}
            onPageChange={handlePageChange}
            onSearchChange={handleSearchChange}
            onFilterFieldChange={handleFilterFieldChange}
            className="mt-10 max-w-[1920px]"
          >
            {isFirstLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : (
              <ComponentCodeList
                codeRendererServer={codegenDetail?.codeRendererUrl || ""}
                items={componentListData?.data || []}
                onItemClick={handleItemClick}
                onDeleteClick={handleDeleteClick}
              />
            )}
          </ComponentCodeFilterContainer>
        </LLMSelectorProvider>
      </ScrollArea>
    </>
  )
}
