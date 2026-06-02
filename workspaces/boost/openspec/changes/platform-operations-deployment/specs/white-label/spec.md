# White-Label Branding

Customize the Augment experience to match the organization's brand — all at runtime, no deployment required.

## EXISTING Requirements

### Requirement: Appearance Customization

Application name, logo, and color theme are configurable at runtime.

#### Scenario: Brand customization via admin panel

- **WHEN** the admin opens `BrandingPanel` → `AppearanceSection`
- **THEN** application name, logo, and color theme (from presets or custom) are configurable
- **AND** changes apply immediately — users see updated branding without page refresh

### Requirement: Prompt Group Management

Welcome screen prompt groups are configurable with rich editing.

#### Scenario: Edit prompt groups

- **WHEN** the admin opens `PromptsPanel`
- **THEN** `GroupEditor` and `CardEditor` allow creating and editing prompt groups
- **AND** each group has icons (via `IconPicker`), colors (via `ColorPicker`), and suggested prompts
- **AND** groups can be reordered
- **AND** `LivePreview` shows real-time rendering of changes

### Requirement: Chat Experience Configuration (Kagenti)

Featured agents and conversation starters are configurable.

#### Scenario: Configure featured agents and starters

- **WHEN** the admin opens `ChatExperiencePanel`
- **THEN** featured agents for the welcome screen strip are configurable
- **AND** per-agent conversation starters are configurable
- **AND** changes apply at runtime
