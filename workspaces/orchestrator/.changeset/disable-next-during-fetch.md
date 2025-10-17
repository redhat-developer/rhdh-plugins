---
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-react': minor
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-api': minor
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-widgets': minor
---

Disable Next button when active widgets are fetching and processing data

- Add isFetching state tracking to StepperContext using a counter to monitor multiple concurrent async operations
- Update OrchestratorFormToolbar to disable Next button when isFetching is true (in addition to existing isValidating check)
- Add handleFetchStarted and handleFetchEnded callbacks to OrchestratorFormContextProps to allow widgets to report their loading status
- Update useFetchAndEvaluate to track complete loading state (fetch + template evaluation) and notify context
- Add isProcessing state to widgets that perform async data processing after fetching (SchemaUpdater, ActiveTextInput, ActiveDropdown, ActiveMultiSelect)
- Track the complete loading lifecycle: fetch → process → ready, ensuring Next button is disabled until all async work completes
