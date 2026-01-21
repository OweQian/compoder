"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Edit2, Trash2, X } from "lucide-react"
import type { CodegenConfigProps } from "./interface"
import type { Codegen, CodegenRule } from "@/lib/db/codegen/types"

const RULE_TYPES: CodegenRule["type"][] = [
  "public-components",
  "styles",
  "file-structure",
  "attention-rules",
  "private-components",
]

function CodegenConfig({
  initialData,
  onChange,
  onSubmit,
  onCancel,
  className,
}: CodegenConfigProps) {
  const [formData, setFormData] = useState<Partial<Codegen>>({
    title: "",
    description: "",
    fullStack: "React",
    guides: [],
    model: "",
    codeRendererUrl: "",
    rules: [],
    ...initialData,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [editingGuideIndex, setEditingGuideIndex] = useState<number | null>(null)
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null)
  const [newGuideText, setNewGuideText] = useState("")
  const [deleteGuideIndex, setDeleteGuideIndex] = useState<number | null>(null)
  const [deleteRuleIndex, setDeleteRuleIndex] = useState<number | null>(null)
  const [ruleFormData, setRuleFormData] = useState<Partial<CodegenRule>>({
    type: "public-components",
    description: "",
  })

  // 同步 initialData 变化
  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({ ...prev, ...initialData }))
    }
  }, [initialData])

  // 触发 onChange
  useEffect(() => {
    onChange?.(formData)
  }, [formData, onChange])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title?.trim()) {
      newErrors.title = "Title is required"
    }

    if (!formData.description?.trim()) {
      newErrors.description = "Description is required"
    }

    if (!formData.fullStack || !["React", "Vue"].includes(formData.fullStack)) {
      newErrors.fullStack = "FullStack must be React or Vue"
    }

    if (!formData.model?.trim()) {
      newErrors.model = "Model is required"
    }

    if (!formData.codeRendererUrl?.trim()) {
      newErrors.codeRendererUrl = "CodeRendererUrl is required"
    } else {
      try {
        new URL(formData.codeRendererUrl)
      } catch {
        newErrors.codeRendererUrl = "CodeRendererUrl must be a valid URL"
      }
    }

    // 验证 rules
    formData.rules?.forEach((rule, index) => {
      if (!rule.description?.trim()) {
        newErrors[`rule-${index}-description`] = "Rule description is required"
      }

      if (rule.type === "styles" || rule.type === "file-structure" || rule.type === "attention-rules") {
        if (!rule.prompt?.trim()) {
          newErrors[`rule-${index}-prompt`] = "Prompt is required for this rule type"
        }
      }

      if (rule.type === "public-components") {
        if (!rule.dataSet || rule.dataSet.length === 0) {
          newErrors[`rule-${index}-dataSet`] = "At least one component library is required"
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) {
      return
    }

    const codegenData: Codegen = {
      title: formData.title!,
      description: formData.description!,
      fullStack: formData.fullStack as "React" | "Vue",
      guides: formData.guides || [],
      model: formData.model!,
      codeRendererUrl: formData.codeRendererUrl!,
      rules: formData.rules || [],
    }

    onSubmit?.(codegenData)
  }

  const handleAddGuide = () => {
    if (newGuideText.trim()) {
      setFormData((prev) => ({
        ...prev,
        guides: [...(prev.guides || []), newGuideText.trim()],
      }))
      setNewGuideText("")
    }
  }

  const handleEditGuide = (index: number) => {
    setEditingGuideIndex(index)
    setNewGuideText(formData.guides?.[index] || "")
  }

  const handleSaveGuide = () => {
    if (editingGuideIndex !== null && newGuideText.trim()) {
      const updatedGuides = [...(formData.guides || [])]
      updatedGuides[editingGuideIndex] = newGuideText.trim()
      setFormData((prev) => ({
        ...prev,
        guides: updatedGuides,
      }))
      setEditingGuideIndex(null)
      setNewGuideText("")
    }
  }

  const handleDeleteGuide = () => {
    if (deleteGuideIndex !== null) {
      const updatedGuides = formData.guides?.filter((_, index) => index !== deleteGuideIndex) || []
      setFormData((prev) => ({
        ...prev,
        guides: updatedGuides,
      }))
      setDeleteGuideIndex(null)
    }
  }

  const handleAddRule = () => {
    const newRule: CodegenRule = {
      type: ruleFormData.type || "public-components",
      description: ruleFormData.description || "",
      ...(ruleFormData.type === "public-components" && {
        dataSet: ruleFormData.dataSet || [],
      }),
      ...((ruleFormData.type === "styles" ||
        ruleFormData.type === "file-structure" ||
        ruleFormData.type === "attention-rules") && {
        prompt: ruleFormData.prompt || "",
      }),
      ...(ruleFormData.type === "private-components" && {
        docs: ruleFormData.docs || {},
      }),
    }

    setFormData((prev) => ({
      ...prev,
      rules: [...(prev.rules || []), newRule],
    }))

    // 重置规则表单
    setRuleFormData({
      type: "public-components",
      description: "",
    })
  }

  const handleEditRule = (index: number) => {
    const rule = formData.rules?.[index]
    if (rule) {
      setEditingRuleIndex(index)
      setRuleFormData({
        type: rule.type,
        description: rule.description,
        dataSet: rule.dataSet,
        prompt: rule.prompt,
        docs: rule.docs,
      })
    }
  }

  const handleSaveRule = () => {
    if (editingRuleIndex !== null) {
      const updatedRule: CodegenRule = {
        type: ruleFormData.type || "public-components",
        description: ruleFormData.description || "",
        ...(ruleFormData.type === "public-components" && {
          dataSet: ruleFormData.dataSet || [],
        }),
        ...((ruleFormData.type === "styles" ||
          ruleFormData.type === "file-structure" ||
          ruleFormData.type === "attention-rules") && {
          prompt: ruleFormData.prompt || "",
        }),
        ...(ruleFormData.type === "private-components" && {
          docs: ruleFormData.docs || {},
        }),
      }

      const updatedRules = [...(formData.rules || [])]
      updatedRules[editingRuleIndex] = updatedRule
      setFormData((prev) => ({
        ...prev,
        rules: updatedRules,
      }))

      setEditingRuleIndex(null)
      setRuleFormData({
        type: "public-components",
        description: "",
      })
    }
  }

  const handleDeleteRule = () => {
    if (deleteRuleIndex !== null) {
      const updatedRules = formData.rules?.filter((_, index) => index !== deleteRuleIndex) || []
      setFormData((prev) => ({
        ...prev,
        rules: updatedRules,
      }))
      setDeleteRuleIndex(null)
    }
  }

  const handleAddComponentLibrary = () => {
    const libraryName = prompt("Enter component library name:")
    if (libraryName?.trim()) {
      setRuleFormData((prev) => ({
        ...prev,
        dataSet: [...(prev.dataSet || []), libraryName.trim()],
      }))
    }
  }

  const handleRemoveComponentLibrary = (index: number) => {
    setRuleFormData((prev) => ({
      ...prev,
      dataSet: prev.dataSet?.filter((_, i) => i !== index) || [],
    }))
  }

  const handleRuleTypeChange = (type: CodegenRule["type"]) => {
    setRuleFormData({
      type,
      description: ruleFormData.description || "",
      // 清除不相关的字段
      ...(type === "public-components" && { dataSet: [] }),
      ...((type === "styles" || type === "file-structure" || type === "attention-rules") && {
        prompt: "",
      }),
      ...(type === "private-components" && { docs: {} }),
    })
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle>Codegen Configuration</CardTitle>
          <CardDescription>
            Configure your Codegen template with basic information, guides, and rules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>

            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter codegen title"
                className={errors.title ? "border-destructive" : ""}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Enter codegen description"
                className={errors.description ? "border-destructive" : ""}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullStack">
                FullStack <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.fullStack || "React"}
                onValueChange={(value: "React" | "Vue") =>
                  setFormData((prev) => ({ ...prev, fullStack: value }))
                }
              >
                <SelectTrigger
                  id="fullStack"
                  className={errors.fullStack ? "border-destructive" : ""}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="React">React</SelectItem>
                  <SelectItem value="Vue">Vue</SelectItem>
                </SelectContent>
              </Select>
              {errors.fullStack && (
                <p className="text-sm text-destructive">{errors.fullStack}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">
                Model <span className="text-destructive">*</span>
              </Label>
              <Input
                id="model"
                value={formData.model || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, model: e.target.value }))
                }
                placeholder="Enter AI model name (e.g., gpt-4o)"
                className={errors.model ? "border-destructive" : ""}
              />
              {errors.model && (
                <p className="text-sm text-destructive">{errors.model}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="codeRendererUrl">
                CodeRendererUrl <span className="text-destructive">*</span>
              </Label>
              <Input
                id="codeRendererUrl"
                type="url"
                value={formData.codeRendererUrl || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, codeRendererUrl: e.target.value }))
                }
                placeholder="Enter code renderer URL"
                className={errors.codeRendererUrl ? "border-destructive" : ""}
              />
              {errors.codeRendererUrl && (
                <p className="text-sm text-destructive">{errors.codeRendererUrl}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Guides Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Guides</h3>
            </div>

            <div className="space-y-2">
              {formData.guides?.map((guide, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 border rounded-md"
                >
                  <span className="flex-1">{guide}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditGuide(index)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteGuideIndex(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {editingGuideIndex === null ? (
                <div className="flex gap-2">
                  <Input
                    value={newGuideText}
                    onChange={(e) => setNewGuideText(e.target.value)}
                    placeholder="Enter guide example"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddGuide()
                      }
                    }}
                  />
                  <Button onClick={handleAddGuide}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Guide
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={newGuideText}
                    onChange={(e) => setNewGuideText(e.target.value)}
                    placeholder="Edit guide example"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleSaveGuide()
                      }
                    }}
                  />
                  <Button onClick={handleSaveGuide}>Save</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingGuideIndex(null)
                      setNewGuideText("")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Rules Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Rules</h3>
            </div>

            <div className="space-y-3">
              {formData.rules?.map((rule, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{rule.type}</Badge>
                          <span className="text-sm font-medium">{rule.description}</span>
                        </div>
                        {rule.type === "public-components" && rule.dataSet && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {rule.dataSet.map((lib, libIndex) => (
                              <Badge key={libIndex} variant="secondary">
                                {lib}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {(rule.type === "styles" ||
                          rule.type === "file-structure" ||
                          rule.type === "attention-rules") &&
                          rule.prompt && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {rule.prompt}
                            </p>
                          )}
                        {rule.type === "private-components" && rule.docs && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {Object.keys(rule.docs).length} component library(s)
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditRule(index)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteRuleIndex(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add/Edit Rule Form */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingRuleIndex !== null ? "Edit Rule" : "Add Rule"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="rule-type">Rule Type</Label>
                    <Select
                      value={ruleFormData.type}
                      onValueChange={handleRuleTypeChange}
                    >
                      <SelectTrigger id="rule-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RULE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rule-description">
                      Description <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="rule-description"
                      value={ruleFormData.description || ""}
                      onChange={(e) =>
                        setRuleFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Enter rule description"
                    />
                  </div>

                  {ruleFormData.type === "public-components" && (
                    <div className="space-y-2">
                      <Label>Component Libraries</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {ruleFormData.dataSet?.map((lib, index) => (
                          <Badge key={index} variant="secondary" className="gap-1">
                            {lib}
                            <button
                              onClick={() => handleRemoveComponentLibrary(index)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddComponentLibrary}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Component Library
                      </Button>
                    </div>
                  )}

                  {(ruleFormData.type === "styles" ||
                    ruleFormData.type === "file-structure" ||
                    ruleFormData.type === "attention-rules") && (
                    <div className="space-y-2">
                      <Label htmlFor="rule-prompt">
                        Prompt <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="rule-prompt"
                        value={ruleFormData.prompt || ""}
                        onChange={(e) =>
                          setRuleFormData((prev) => ({
                            ...prev,
                            prompt: e.target.value,
                          }))
                        }
                        placeholder="Enter prompt text"
                        rows={6}
                      />
                    </div>
                  )}

                  {ruleFormData.type === "private-components" && (
                    <div className="space-y-2">
                      <Label>Component Documentation</Label>
                      <p className="text-sm text-muted-foreground">
                        Private components configuration is complex. Please edit the JSON
                        structure directly or use a dedicated editor.
                      </p>
                      <Textarea
                        value={JSON.stringify(ruleFormData.docs || {}, null, 2)}
                        onChange={(e) => {
                          try {
                            const docs = JSON.parse(e.target.value)
                            setRuleFormData((prev) => ({ ...prev, docs }))
                          } catch {
                            // Invalid JSON, ignore
                          }
                        }}
                        placeholder='{"libraryName": {"componentName": {"description": "...", "api": "..."}}}'
                        rows={6}
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    {editingRuleIndex !== null ? (
                      <>
                        <Button onClick={handleSaveRule}>Save Rule</Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingRuleIndex(null)
                            setRuleFormData({
                              type: "public-components",
                              description: "",
                            })
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button onClick={handleAddRule}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Rule
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button onClick={handleSubmit}>Save Configuration</Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Guide Confirmation Dialog */}
      <Dialog open={deleteGuideIndex !== null} onOpenChange={() => setDeleteGuideIndex(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Guide</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this guide? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteGuideIndex(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteGuide}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Rule Confirmation Dialog */}
      <Dialog open={deleteRuleIndex !== null} onOpenChange={() => setDeleteRuleIndex(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this rule? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRuleIndex(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRule}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CodegenConfig
