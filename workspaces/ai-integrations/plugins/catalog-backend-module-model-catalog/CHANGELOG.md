# @red-hat-developer-hub/backstage-plugin-catalog-backend-module-model-catalog

## 0.9.0

### Minor Changes

- f57ad78: Backstage version bump to v1.45.3

## 0.8.0

### Minor Changes

- 44c967a: Backstage version bump to v1.44.2

## 0.7.0

### Minor Changes

- 7b81c3d: copy model/modelServer annotations to resource/component annotations

## 0.6.0

### Minor Changes

- 986f8ad: Backstage version bump to v1.42.5

## 0.5.0

### Minor Changes

- 7dc735d: a new backstage plugin, a sevice factory, is delivered to provide a URLReader that interacts with the model catalog bridges techdoc/model card endpoint; the catalog backend module is also updated so that the bridge configration information is exported and reusable by the techdoc plugin

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
