/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  createTranslationRef,
  type TranslationRef,
} from '@backstage/core-plugin-api/alpha';

/**
 * All English messages for the DCM plugin.
 * Export separately so tests can flatten them via mockTranslations.
 * @public
 */
export const dcmMessages = {
  page: {
    title: 'Data Center',
    tabs: {
      providers: 'Providers',
      policies: 'Policies',
      serviceTypes: 'Service types',
      catalogItems: 'Catalog items',
      instances: 'Instances',
      resources: 'Resources',
    },
  },
  common: {
    retry: 'Retry',
    refresh: 'Refresh',
    search: 'Search',
    clearSearch: 'Clear search',
    edit: 'Edit',
    delete: 'Delete',
    actions: 'Actions',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving\u2026',
    close: 'Close',
    rows: 'rows',
    emDash: '\u2014',
  },
  deleteDialog: {
    title: 'Delete {{resourceLabel}}',
    confirmButton: 'Delete',
    cancelButton: 'Cancel',
    body: 'Are you sure you want to delete {{resourceName}}? This action cannot be undone.',
  },
  providers: {
    emptyTitle: 'No providers registered',
    emptyDescription:
      'Register a service provider to allow DCM to provision resources on external infrastructure (e.g. OpenShift, AWS).',
    registerButton: 'Register',
    entityLabel: 'Providers',
    registerDialogTitle: 'Register provider',
    editDialogTitle: 'Edit provider',
    saveButton: 'Save',
    createSuccess: 'Provider registered successfully.',
    updateSuccess: 'Provider updated successfully.',
    deleteSuccess: 'Provider deleted successfully.',
    deleteLabel: 'provider',
    columns: {
      displayName: 'Display name',
      name: 'Name',
      endpoint: 'Endpoint',
      serviceType: 'Service type',
      operations: 'Operations',
      status: 'Status',
    },
    form: {
      nameLabel: 'Name *',
      namePlaceholder: 'e.g. my-k8s-provider',
      nameHelper:
        'Unique slug identifier \u2014 only lowercase letters, numbers, and hyphens',
      nameHelperEditMode: 'Provider name cannot be changed after creation',
      endpointLabel: 'Endpoint *',
      endpointPlaceholder: 'https://api.example.com',
      endpointHelper:
        'Full URL of the provider API (e.g. https://api.example.com)',
      serviceTypeLabel: 'Service type *',
      serviceTypeEmpty: 'No service types available',
      serviceTypeSelect: 'Select a service type\u2026',
      serviceTypeHelperNoTypes:
        'Create a service type first in the Service types tab',
      serviceTypeHelperDefault: 'Select from registered service types',
      schemaVersionLabel: 'Schema version *',
      schemaVersionHelper:
        'e.g. v1, v1alpha1, v2beta2 \u2014 only v<number>[alpha|beta][number]',
      operationsLabel: 'Operations',
      operationsHelper: 'Select the operations this provider supports',
    },
  },
  policies: {
    emptyTitle: 'No policies defined',
    emptyDescription:
      'Create OPA Rego policies to enforce governance rules on DCM resources. Policies can be scoped globally or per user.',
    createButton: 'Create',
    entityLabel: 'Policies',
    createDialogTitle: 'Create policy',
    editDialogTitle: 'Edit policy',
    saveButton: 'Save',
    createSuccess: 'Policy created successfully.',
    updateSuccess: 'Policy updated successfully.',
    deleteSuccess: 'Policy deleted successfully.',
    deleteLabel: 'policy',
    enabledYes: 'Yes',
    enabledNo: 'No',
    toggleDisable: 'Disable policy',
    toggleEnable: 'Enable policy',
    toggleDisableAria: 'Disable',
    toggleEnableAria: 'Enable',
    columns: {
      displayName: 'Display name',
      type: 'Type',
      priority: 'Priority',
      enabled: 'Enabled',
      description: 'Description',
    },
    form: {
      displayNameLabel: 'Display name *',
      displayNameHelper: 'Human-readable name for this policy',
      descriptionLabel: 'Description',
      descriptionHelper: 'Optional \u2014 describe the purpose of this policy',
      policyTypeLabel: 'Policy type *',
      policyTypeGlobal: 'GLOBAL \u2014 applies to all requests',
      policyTypeUser: 'USER \u2014 applies per user',
      priorityLabel: 'Priority *',
      priorityHelper:
        '1 (highest) \u2013 1000 (lowest), default 500 \u2014 must be unique per policy type',
      regoCodeLabel: 'Rego code *',
      regoCodeHelper: 'OPA Rego policy evaluated by the Placement Manager.',
      regoCodePlaceholder: 'package dcm.placement',
      enabledLabel: 'Enabled',
    },
  },
  serviceTypes: {
    emptyTitle: 'No service types defined',
    emptyDescription:
      'Service types define the template schema for catalog items.',
    cardTitle: 'Service types ({{count}})',
    columns: {
      serviceType: 'Service type',
      apiVersion: 'API version',
      path: 'Path',
      created: 'Created',
    },
  },
  catalogItems: {
    emptyTitle: 'No catalog items defined',
    emptyDescription:
      'Catalog items are service templates that developers can provision. Each catalog item references a service type and defines the fields available for customization.',
    createButton: 'Create',
    entityLabel: 'Catalog items',
    createDrawerTitle: 'Create catalog item',
    editDrawerTitle: 'Edit catalog item',
    saveButton: 'Save',
    createSuccess: 'Catalog item created successfully.',
    updateSuccess: 'Catalog item updated successfully.',
    deleteSuccess: 'Catalog item deleted successfully.',
    deleteLabel: 'catalog item',
    columns: {
      displayName: 'Display name',
      apiVersion: 'API version',
      serviceType: 'Service type',
      fields: 'Fields',
      created: 'Created',
    },
    fieldCount: {
      one: '1 field',
      other: '{{count}} fields',
    },
    form: {
      importButton: 'Import from file',
      importTooltip:
        'Fill the form from a JSON or YAML catalog item definition',
      importError:
        'Failed to import file \u2014 check that it is valid JSON or YAML.',
      displayNameLabel: 'Display name *',
      displayNameHelper:
        'Human-readable name for this catalog item (max 63 characters)',
      apiVersionLabel: 'API version *',
      apiVersionHelper:
        'Must follow the pattern v<number>[alpha|beta][number] \u2014 e.g. v1, v1alpha1',
      serviceTypeLabel: 'Service type *',
      serviceTypeHelperEdit: 'Service type cannot be changed after creation',
      serviceTypeHelperNoTypes:
        'No service types available \u2014 create one in the Service types tab',
      serviceTypeHelperDefault: 'Select the service type this item is based on',
      fieldsLabel: 'Fields *',
      fieldsCaption: '(at least one required)',
      fieldsErrorEmpty: 'Add at least one field with a non-empty path.',
      fieldAddButton: 'Add field',
      fieldAddTooltip:
        'Fill in the path of the last field before adding a new one',
      fieldPathLabel: 'Path *',
      fieldPathHelper: 'e.g. config.replicas',
      fieldDisplayNameLabel: 'Display name',
      fieldEditableLabel: 'Editable',
      fieldDefaultValueLabel: 'Default value',
      fieldDefaultValueHelper:
        'Any JSON value \u2014 e.g. 42, "hello", true, [1,2]',
      fieldRemoveAriaLabel: 'Remove field',
      schemaLabel: 'Validation schema',
      schemaEditButton: 'Edit JSON',
      schemaAddButton: 'Add JSON',
      schemaDialogTitle: 'Validation schema',
      schemaDialogHelper:
        'JSON Schema object \u2014 e.g. {"type":"integer","minimum":0}',
      schemaDialogCancel: 'Cancel',
      schemaDialogApply: 'Apply',
      schemaMustBeObject: 'Must be a JSON object, not an array or primitive',
      schemaInvalidJson: 'Invalid JSON syntax',
    },
  },
  instances: {
    emptyTitle: 'No instances provisioned',
    emptyDescription:
      'Catalog item instances represent provisioned services. Create an instance from a catalog item to provision a service on the registered provider infrastructure.',
    createButton: 'Create',
    entityLabel: 'Catalog item instances',
    createDialogTitle: 'Create catalog item instance',
    rehydrateSuccess: 'Catalog item instance rehydrated successfully.',
    deleteLabel: 'instance',
    rehydrateTooltip: 'Rehydrate',
    rehydrateAriaLabel: 'Rehydrate instance',
    deleteTooltip: 'Delete',
    deleteAriaLabel: 'Delete instance',
    rehydrateDialogTitle: 'Rehydrate instance?',
    rehydrateDialogBody:
      'Rehydrating {{instanceName}} will re-provision the resource and may assign a new resource ID. This action cannot be undone.',
    rehydrateDialogFallbackName: 'this instance',
    rehydrateDialogCancel: 'Cancel',
    rehydrateDialogConfirm: 'Rehydrate',
    columns: {
      displayName: 'Display name',
      catalogItem: 'Catalog item',
      resourceId: 'Resource ID',
      apiVersion: 'API version',
      created: 'Created',
    },
    form: {
      displayNameLabel: 'Display name *',
      displayNameHelper:
        'Human-readable name for this provisioned instance (max 63 characters)',
      catalogItemLabel: 'Catalog item *',
      catalogItemSelect: 'Select a catalog item\u2026',
      catalogItemHelperNoItems:
        'No catalog items available \u2014 create one in the Catalog items tab',
      catalogItemHelperDefault:
        'Choose the catalog item to provision an instance from',
      apiVersionLabel: 'API version *',
      apiVersionHelper:
        'Must follow the pattern v<number>[alpha|beta][number] \u2014 e.g. v1, v1alpha1',
      fieldValuesSection: 'Field values',
      fieldValuesSectionHint: '(editable fields defined by this catalog item)',
      noEditableFields: 'This catalog item has no editable fields.',
    },
  },
  resources: {
    emptyTitle: 'No resources found',
    emptyDescription:
      'Service type instances provisioned through DCM will appear here.',
    cardTitle: 'Resources ({{count}})',
    columns: {
      id: 'ID',
      serviceType: 'Service type',
      provider: 'Provider',
      status: 'Status',
      created: 'Created',
    },
  },
  copyButton: {
    copy: 'Copy',
    copied: 'Copied!',
    failed: 'Copy failed',
    ariaLabel: 'Copy to clipboard',
  },
  validation: {
    provider: {
      nameRequired: 'Name is required',
      namePattern:
        'Only lowercase letters, numbers, and hyphens are allowed (must start with a letter)',
      endpointRequired: 'Endpoint is required',
      endpointPattern:
        'Must start with http:// or https:// (e.g. http://my-service:8081/api)',
      serviceTypeRequired: 'Service type is required',
      serviceTypeMin: 'Please select a service type from the list',
      schemaVersionRequired: 'Schema version is required',
      schemaVersionPattern:
        'Must follow the pattern v<number>[alpha|beta][number] \u2014 e.g. v1, v1alpha1, v2beta2',
    },
    policy: {
      displayNameRequired: 'Display name is required',
      displayNameEmpty: 'Display name cannot be empty',
      displayNameMax: 'Display name must be at most 255 characters',
      descriptionMax: 'Description must be at most 255 characters',
      policyTypeRequired: 'Policy type is required',
      policyTypeOneOf: 'Must be GLOBAL or USER',
      priorityType: 'Priority must be a number',
      priorityRequired: 'Priority is required',
      priorityInteger: 'Priority must be a whole number',
      priorityMin: 'Priority must be at least 1',
      priorityMax: 'Priority must be at most 1000',
      regoCodeRequired: 'Rego code is required',
      regoCodeEmpty: 'Rego code cannot be empty',
      regoCodePackage:
        'Must contain a package declaration \u2014 e.g. "package dcm.placement"',
    },
    catalogItem: {
      displayNameRequired: 'Display name is required',
      displayNameEmpty: 'Display name cannot be empty',
      displayNameMax: 'Display name must be at most 63 characters',
      apiVersionRequired: 'API version is required',
      apiVersionPattern:
        'Must follow the pattern v<number>[alpha|beta][number] \u2014 e.g. v1, v1alpha1',
      serviceTypeRequired: 'Service type is required',
      duplicatePath: 'Duplicate path \u2014 paths must be unique',
      invalidJson:
        'Invalid JSON \u2014 fix the syntax or use a plain string value',
      schemaMustBeObject:
        'Must be a JSON object \u2014 e.g. {"type":"integer"}',
      schemaMinMaxConflict:
        'minimum ({{min}}) must not exceed maximum ({{max}})',
      defaultBelowMin:
        'Default value ({{value}}) is below the schema minimum ({{min}})',
      defaultAboveMax:
        'Default value ({{value}}) exceeds the schema maximum ({{max}})',
      schemaInvalidJson: 'Invalid JSON syntax',
    },
    instance: {
      displayNameRequired: 'Display name is required',
      displayNameEmpty: 'Display name cannot be empty',
      displayNameMax: 'Display name must be at most 63 characters',
      catalogItemRequired: 'Catalog item is required',
      apiVersionRequired: 'API version is required',
      apiVersionPattern:
        'Must follow the pattern v<number>[alpha|beta][number] \u2014 e.g. v1, v1alpha1',
      fieldRequired: 'This field is required',
      fieldMustBeNumber: 'Must be a valid number',
      fieldMin: 'Must be at least {{min}}',
      fieldMax: 'Must be at most {{max}}',
    },
  },
};

/**
 * Translation reference for the DCM plugin.
 * @public
 */
export const dcmTranslationRef: TranslationRef<
  'plugin.dcm',
  Record<string, string>
> = createTranslationRef({
  id: 'plugin.dcm',
  messages: dcmMessages,
}) as unknown as TranslationRef<'plugin.dcm', Record<string, string>>;
