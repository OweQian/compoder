import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import CodegenConfig from "./CodegenConfig"
import type { CodegenConfigProps } from "./interface"
import type { Codegen } from "@/lib/db/codegen/types"

const meta = {
  title: "Biz/CodegenConfig",
  component: CodegenConfig,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof CodegenConfig>

export default meta
type Story = StoryObj<typeof CodegenConfig>

const mockCodegenData: Codegen = {
  title: "Shadcn/UI Codegen",
  description: "Code generator based on Shadcn/UI",
  fullStack: "React",
  guides: [
    "Generate a login page",
    "Generate a Table component, include 3 columns: name, age, address",
  ],
  model: "gpt-4o",
  codeRendererUrl: "http://localhost:3001",
  rules: [
    {
      type: "public-components",
      description: "Define which public components to use",
      dataSet: ["shadcn/ui"],
    },
    {
      type: "styles",
      description: "Define the rules for generating styles",
      prompt:
        "Styles must be written using tailwindcss with full dark/light mode compatibility. Use Tailwind's dark mode utilities (dark:class-name) for theme variants.",
    },
    {
      type: "attention-rules",
      description: "Attention rules for the code generator",
      prompt:
        "Only use the following npm packages in the generated code: react, react-dom, lucide-react, next/link, next/image, @/lib/utils, framer-motion, react-hook-form, recharts, zod, and components from @/components/ui/* (shadcn base components).",
    },
  ],
}

export const Default: Story = {
  args: {
    initialData: undefined,
    onChange: (data) => {
      console.log("Form data changed:", data)
    },
    onSubmit: (data) => {
      console.log("Form submitted:", data)
      alert("Configuration saved!")
    },
    onCancel: () => {
      console.log("Form cancelled")
      alert("Configuration cancelled!")
    },
  },
}

export const WithInitialData: Story = {
  args: {
    initialData: mockCodegenData,
    onChange: (data) => {
      console.log("Form data changed:", data)
    },
    onSubmit: (data) => {
      console.log("Form submitted:", data)
      alert("Configuration saved!")
    },
    onCancel: () => {
      console.log("Form cancelled")
      alert("Configuration cancelled!")
    },
  },
}

export const WithMultipleRules: Story = {
  args: {
    initialData: {
      ...mockCodegenData,
      rules: [
        ...mockCodegenData.rules,
        {
          type: "file-structure",
          description: "Define the file structure for the project",
          prompt:
            "Output component code in XML format as follows:\n<ComponentArtifact name=\"ComponentName\">\n  <ComponentFile fileName=\"App.tsx\" isEntryFile=\"true\">\n    import { ComponentName } from './ComponentName';\n    \n    const mockProps = {\n      // Define mock data here\n    };\n    \n    export default function App() {\n      return <ComponentName {...mockProps} />;\n    }\n  </ComponentFile>\n</ComponentArtifact>",
        },
        {
          type: "private-components",
          description: "Private component documentation",
          docs: {
            "custom-ui": {
              Button: {
                description: "A customizable button component",
                api: "Button(props: { variant?: 'primary' | 'secondary', size?: 'sm' | 'md' | 'lg' })",
              },
              Input: {
                description: "A text input component",
                api: "Input(props: { placeholder?: string, value?: string, onChange?: (e: Event) => void })",
              },
            },
          },
        },
      ],
    },
    onChange: (data) => {
      console.log("Form data changed:", data)
    },
    onSubmit: (data) => {
      console.log("Form submitted:", data)
      alert("Configuration saved!")
    },
    onCancel: () => {
      console.log("Form cancelled")
      alert("Configuration cancelled!")
    },
  },
}

export const VueCodegen: Story = {
  args: {
    initialData: {
      title: "Vue 3 Codegen",
      description: "Code generator based on Vue 3",
      fullStack: "Vue",
      guides: ["Generate a Vue component with composition API"],
      model: "gpt-4o",
      codeRendererUrl: "http://localhost:3002",
      rules: [
        {
          type: "public-components",
          description: "Use Vue 3 components",
          dataSet: ["vue", "@vueuse/core"],
        },
        {
          type: "styles",
          description: "Use Tailwind CSS",
          prompt: "Use Tailwind CSS for styling",
        },
      ],
    },
    onChange: (data) => {
      console.log("Form data changed:", data)
    },
    onSubmit: (data) => {
      console.log("Form submitted:", data)
      alert("Configuration saved!")
    },
    onCancel: () => {
      console.log("Form cancelled")
      alert("Configuration cancelled!")
    },
  },
}

export const EmptyState: Story = {
  args: {
    initialData: {
      title: "",
      description: "",
      fullStack: "React",
      guides: [],
      model: "",
      codeRendererUrl: "",
      rules: [],
    },
    onChange: (data) => {
      console.log("Form data changed:", data)
    },
    onSubmit: (data) => {
      console.log("Form submitted:", data)
      alert("Configuration saved!")
    },
    onCancel: () => {
      console.log("Form cancelled")
      alert("Configuration cancelled!")
    },
  },
}

export const Interactive: Story = {
  render: function InteractiveStory() {
    const [data, setData] = React.useState<Partial<Codegen>>(mockCodegenData)

    return (
      <div className="space-y-4">
        <CodegenConfig
          initialData={data}
          onChange={(newData) => {
            setData(newData)
            console.log("Form data changed:", newData)
          }}
          onSubmit={(validatedData) => {
            console.log("Form submitted:", validatedData)
            alert("Configuration saved!")
          }}
          onCancel={() => {
            console.log("Form cancelled")
            setData(mockCodegenData)
          }}
        />
        <div className="mt-4 p-4 bg-muted rounded-md">
          <h3 className="font-semibold mb-2">Current Form Data:</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    )
  },
}
