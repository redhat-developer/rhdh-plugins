---
'@red-hat-developer-hub/backstage-plugin-dcm-common': major
'@red-hat-developer-hub/backstage-plugin-dcm': major
---

Add multi-resource support for Catalog Items and Catalog Item Instances.

**API type changes (`dcm-common`)**

- `CatalogItemSpec` now holds a `resources?: CatalogResource[]` array instead of a single `service_type` + `fields`.
- New `CatalogResource` interface: `{ name, service_type, requires_resources?, fields? }`.
- `UserValue` gains a required `resource` field that identifies which resource the value targets.
- `CatalogItemInstanceSpec` gains `resource_ids?: string[]` (replaces the top-level `resource_id`).

**UI changes (`dcm`)**

- Catalog Item create/edit now uses a vertical-tabbed wizard dialog (`CatalogItemWizardDialog`) with tabs: Overview, API, Resources, and one tab per resource for field configurations.
- Catalog Item Instance create now uses a vertical-tabbed wizard dialog (`InstanceWizardDialog`) with an Overview tab and one tab per resource that has editable fields.
- Shared components extracted: `VerticalTabDialog`, `SchemaButton`, `ResourceFieldsPanel`, `UserValueFields`.
- Shared utility `validateJsonObject` de-duplicates JSON-object validation across `SchemaButton` and `catalogItemFormTypes`.
- Table columns updated: "Service type" replaced by "Resources" (chips per service_type); field count sums across all resources.
