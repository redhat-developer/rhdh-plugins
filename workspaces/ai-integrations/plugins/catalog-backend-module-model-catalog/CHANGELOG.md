# @red-hat-developer-hub/backstage-plugin-catalog-backend-module-model-catalog

## 0.4.0

### Minor Changes

- 21f35a2: Add TechDocs annotations to generated Resource entities when present in the JSON object

### Patch Changes

- f99bda6: add a log message around registering the 'rhdh-rhoai-bridge' location type
- 23dccda: Bug fixes to the model catalog plugin to resolve issues setting the user, license URL and authentication metadata in the generated catalog entities

## 0.3.0

### Minor Changes

- 340bf72: simplifying model catalog entity provider configuration until running the bridge as a pod is officially supported

### Patch Changes

- 13a7a3a: Add null check when retrieving keys from catalog bridge

## 0.2.0

### Minor Changes

- 4273bc9: Switch model catalog entity provider and custom processor to use JSON object provided by the bridge

## 0.1.1

### Patch Changes

- ff20aa6: Initial code drop of prototype model catalog plugin originally from redhat-ai-dev fork
