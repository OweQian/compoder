# Feature: Codegen 可视化配置

As a developer
I want to visually configure Codegen templates
So that I can customize code generators based on different tech stacks, component libraries, scenarios, code specifications, and AI models

## Background

Given that I need to create or edit a Codegen template
And the Codegen template includes basic information, guides, and rules
And I want to configure it through a visual interface instead of editing JSON directly

## Scenario 1: 显示 Codegen 基本信息配置表单

Given that I am viewing the Codegen configuration page
When the page loads
Then I should see a form with the following fields:
  - Title input field (required)
  - Description textarea field (required)
  - FullStack selector with options: "React" or "Vue" (required)
  - Model input field for AI model name (required)
  - CodeRendererUrl input field for code renderer URL (required)
And all required fields should be clearly marked
And the form should display current values if editing an existing Codegen

## Scenario 2: 配置 Guides（引导示例）

Given that I am configuring the Codegen template
When I view the Guides section
Then I should see a list of existing guide examples
And I should see an "Add Guide" button
And each guide item should have an edit and delete button

When I click "Add Guide"
Then a new input field should appear
And I can enter a guide example text
And I can save or cancel the new guide

When I click edit on an existing guide
Then the guide text should become editable
And I can modify the text
And I can save or cancel the changes

When I click delete on a guide
Then a confirmation dialog should appear
And upon confirmation, the guide should be removed from the list

## Scenario 3: 配置 Public Components 规则

Given that I am configuring Codegen rules
When I view the Rules section
Then I should see a list of existing rules
And I should see an "Add Rule" button

When I click "Add Rule" and select "public-components" type
Then a new rule configuration form should appear
And I should see:
  - Rule type selector (pre-selected as "public-components")
  - Description input field
  - DataSet section with an "Add Component Library" button
And I can add multiple component library names to the dataSet
And each library name should be displayed as a tag with a remove option
And I can save or cancel the rule configuration

## Scenario 4: 配置 Styles 规则

Given that I am adding a new rule
When I select "styles" as the rule type
Then a configuration form should appear
And I should see:
  - Rule type selector (pre-selected as "styles")
  - Description input field
  - Prompt textarea field (required for styles type)
And the prompt field should support multi-line text input
And I can enter style generation rules and guidelines
And I can save or cancel the rule configuration

## Scenario 5: 配置 File Structure 规则

Given that I am adding a new rule
When I select "file-structure" as the rule type
Then a configuration form should appear
And I should see:
  - Rule type selector (pre-selected as "file-structure")
  - Description input field
  - Prompt textarea field (required for file-structure type)
And the prompt field should support multi-line text input
And I can enter file structure specifications and templates
And I can save or cancel the rule configuration

## Scenario 6: 配置 Attention Rules 规则

Given that I am adding a new rule
When I select "attention-rules" as the rule type
Then a configuration form should appear
And I should see:
  - Rule type selector (pre-selected as "attention-rules")
  - Description input field
  - Prompt textarea field (required for attention-rules type)
And the prompt field should support multi-line text input
And I can enter attention rules and constraints for code generation
And I can save or cancel the rule configuration

## Scenario 7: 配置 Private Components 规则

Given that I am adding a new rule
When I select "private-components" as the rule type
Then a configuration form should appear
And I should see:
  - Rule type selector (pre-selected as "private-components")
  - Description input field
  - Docs section for configuring component documentation
And I can add component libraries
And for each library, I can add components
And for each component, I can configure:
  - Component name
  - Description
  - API documentation
And I can add multiple libraries and components in a hierarchical structure
And I can save or cancel the rule configuration

## Scenario 8: 编辑现有规则

Given that there are existing rules in the Codegen template
When I click edit on a rule
Then the rule configuration form should appear with current values
And I can modify any field based on the rule type
And the form should validate that required fields are filled
And I can save changes or cancel to discard modifications

## Scenario 9: 删除规则

Given that there are existing rules in the Codegen template
When I click delete on a rule
Then a confirmation dialog should appear
And the dialog should show which rule will be deleted
And upon confirmation, the rule should be removed from the list
And upon cancellation, no changes should be made

## Scenario 10: 保存 Codegen 配置

Given that I have configured all Codegen fields
When I click the "Save" button
Then the form should validate all required fields
And if validation passes, the configuration should be saved
And I should see a success message
And if validation fails, error messages should be displayed for invalid fields

When required fields are missing
Then the save action should be prevented
And error indicators should highlight the missing fields
And error messages should explain what is required

## Scenario 11: 表单验证

Given that I am filling out the Codegen configuration form
When I leave a required field empty
Then the field should show a validation error
And the error message should indicate which field is required

When I enter an invalid URL in the CodeRendererUrl field
Then the field should show a validation error
And the error message should indicate that a valid URL is required

When I select an invalid value in the FullStack selector
Then the form should prevent invalid selection
And only "React" or "Vue" should be selectable options

## Scenario 12: 规则类型动态表单

Given that I am adding or editing a rule
When I change the rule type selector
Then the form fields should dynamically update
And fields that are not applicable to the selected type should be hidden
And fields that are required for the selected type should be shown and marked as required
And the form should clear values from fields that are no longer applicable

## Scenario 13: 规则列表展示

Given that I have configured multiple rules
When I view the Rules section
Then I should see all rules listed
And each rule should display:
  - Rule type badge/indicator
  - Description
  - Summary of configuration (e.g., number of component libraries for public-components)
And rules should be displayed in a clear, organized manner
And I should be able to reorder rules if needed

## Scenario 14: 取消编辑

Given that I am editing a Codegen configuration
When I click "Cancel" or navigate away
Then a confirmation dialog should appear if there are unsaved changes
And I can choose to save changes, discard changes, or continue editing
And if I choose to discard, all changes should be reverted to the original values

## Technical Acceptance Criteria

- The component must accept an optional initial Codegen data object
- The component must emit onChange events when form values change
- The component must emit onSubmit event with validated Codegen data structure
- The component must validate all required fields according to CodegenRule types
- The component must handle all five rule types: public-components, styles, private-components, file-structure, attention-rules
- The component must support adding, editing, and deleting guides dynamically
- The component must support adding, editing, and deleting rules dynamically
- The component must maintain proper data structure matching Codegen and CodegenRule interfaces
- The component must be responsive and work in both light and dark themes
- The component must maintain accessibility standards with proper ARIA attributes
- Form validation must prevent invalid data submission
- The component should provide clear visual feedback for all user actions
