# Frontend Composability

The frontend must be decomposed from a monolithic `AugmentPage` into composable extensions with lazy loading, feature flags, and capability-driven rendering.

## ADDED Requirements

### Requirement: Composable Routable Extensions

Deployers can mount chat, admin, and agent studio independently.

#### Scenario: Independent chat extension

- **WHEN** a deployer wants only the chat interface without admin panels
- **THEN** they mount `AugmentChatPage` as a standalone routable extension
- **AND** it is provided via `augmentPlugin.provide(createRoutableExtension({ name: 'AugmentChatPage', mountPoint: chatRouteRef }))`
- **AND** it can be configured independently in `dynamic-plugins.yaml` with its own `dynamicRoutes` entry

#### Scenario: Independent admin extension

- **WHEN** a deployer wants to mount the admin panel at a separate route
- **THEN** they mount `AugmentAdminPage` as a standalone routable extension
- **AND** it uses the existing `settingsAdminRouteRef` mount point

#### Scenario: Monolithic default preserved

- **WHEN** no specific extensions are configured
- **THEN** the existing `AugmentPage` continues to work as the all-in-one default
- **AND** each extension is independently mountable

### Requirement: Lazy Loading in Primary Paths

Provider-specific and admin components are loaded only when needed.

#### Scenario: ChatView lazy loads provider-specific components

- **WHEN** `ChatView.tsx` renders
- **THEN** Kagenti-specific components (`AgentCreateIntentDialog`, `CreateAgentWizard`, `ToolCreateIntentDialog`, `CreateToolWizard`, `AgentLifecycleDetail`) are loaded via `React.lazy()`
- **AND** they are NOT statically imported at the top of the file
- **AND** they load only when the active provider is Kagenti AND the user triggers the relevant action

#### Scenario: AdminLayout lazy loads panel groups

- **WHEN** `AdminLayout.tsx` renders
- **THEN** the 204 admin panel component files are loaded via `React.lazy()` per panel group
- **AND** only the currently active panel group is loaded

### Requirement: Config-Driven Feature Flags

Deployers control feature visibility via `app-config.yaml`.

#### Scenario: Feature flags in app-config

- **WHEN** an administrator configures feature flags in `app-config.yaml`
- **THEN** the following features can be individually enabled or disabled:
  ```yaml
  augment:
    features:
      agentCreation: true
      devSpaces: false
      workflowBuilder: true
      sandbox: false
      observability: true
      adminPanel: true
  ```
- **AND** a `useFeatureFlags` hook reads from `configApiRef`
- **AND** disabled features are not rendered (not just hidden)

#### Scenario: Backstage feature flags registration

- **WHEN** the boost plugin is loaded
- **THEN** it registers feature flags with Backstage's `featureFlagsApiRef`
- **AND** flags can be toggled in the Backstage settings UI without code changes or restarts

### Requirement: UX/UXD Design Alignment

All frontend components and UI flows align with RHDH usability and visual design standards.

#### Scenario: Implementation from UX/UXD mockups

- **WHEN** a frontend feature introduces or modifies user-visible UI
- **THEN** implementation follows approved mockups, wireframes, or design specs provided by the UX/UXD team (Figma, Sketch, or equivalent)
- **AND** no user-facing UI ships without a corresponding approved design artifact
- **AND** custom components that extend beyond PatternFly defaults require explicit UX/UXD review

#### Scenario: Design review gate on frontend PRs

- **WHEN** a frontend PR introduces or modifies user-visible UI (chat, gallery, admin panels, governance controls)
- **THEN** the PR requires UX/UXD sign-off before merge
- **AND** deviations from approved mockups are documented and justified

#### Scenario: PatternFly and accessibility compliance

- **WHEN** frontend components are implemented
- **THEN** they use PatternFly design system components and patterns consistent with RHDH
- **AND** all UI meets WCAG 2.1 AA accessibility standards
- **AND** keyboard navigation and screen reader support are validated
