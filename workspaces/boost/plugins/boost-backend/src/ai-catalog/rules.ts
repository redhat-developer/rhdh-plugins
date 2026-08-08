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
  createPermissionResourceRef,
  createPermissionRule,
  type PermissionRule,
} from '@backstage/plugin-permission-node';
import { z } from 'zod';
import { AI_CATALOG_ASSET_RESOURCE_TYPE } from '@red-hat-developer-hub/backstage-plugin-boost-common';

// ---------------------------------------------------------------------------
// Resource reference + filter types
// ---------------------------------------------------------------------------

/**
 * Filter shape returned by `toQuery()` for catalog query predicates.
 *
 * @internal
 */
export type AiCatalogFilter = {
  key: string;
  values: string[] | undefined;
};

/**
 * Composite filter shapes for permission criteria composition.
 *
 * @internal
 */
export type AiCatalogFilters =
  | { anyOf: AiCatalogFilters[] }
  | { allOf: AiCatalogFilters[] }
  | { not: AiCatalogFilters }
  | AiCatalogFilter;

/**
 * Minimal AI catalog asset resource shape for permission rule evaluation.
 *
 * @internal
 */
export interface AiCatalogAssetResource {
  metadata: {
    annotations?: Record<string, string>;
    namespace?: string;
  };
}

/**
 * Permission resource reference for AI catalog assets.
 *
 * @internal
 */
export const aiCatalogAssetPermissionResourceRef = createPermissionResourceRef<
  AiCatalogAssetResource,
  AiCatalogFilter
>().with({
  pluginId: 'boost',
  resourceType: AI_CATALOG_ASSET_RESOURCE_TYPE,
});

// ---------------------------------------------------------------------------
// Rule: isAiAssetCategory
// ---------------------------------------------------------------------------

type IsAiAssetCategoryParams = { category: string };

const isAiAssetCategoryParamsSchema: z.ZodType<IsAiAssetCategoryParams> =
  z.object({
    category: z
      .string()
      .describe(
        'Asset category to match (e.g., ai-model, agent, skill, mcp-server, model-server)',
      ),
  });

/**
 * Conditional permission rule that filters AI catalog assets by their
 * category annotation (`rhdh.io/ai-asset-category`).
 *
 * @internal
 */
export const isAiAssetCategory = createPermissionRule({
  name: 'isAiAssetCategory',
  description:
    'Matches AI assets by their category (ai-model, agent, skill, mcp-server, model-server)',
  resourceRef: aiCatalogAssetPermissionResourceRef,
  paramsSchema: isAiAssetCategoryParamsSchema,
  apply: (
    resource: AiCatalogAssetResource,
    { category }: IsAiAssetCategoryParams,
  ) => {
    const annotation =
      resource.metadata.annotations?.['rhdh.io/ai-asset-category'];
    return annotation === category;
  },
  toQuery: ({ category }: IsAiAssetCategoryParams) => ({
    key: 'rhdh.io/ai-asset-category',
    values: [category],
  }),
} as any) as unknown as PermissionRule<
  AiCatalogAssetResource,
  AiCatalogFilter,
  typeof AI_CATALOG_ASSET_RESOURCE_TYPE,
  IsAiAssetCategoryParams
>;

// ---------------------------------------------------------------------------
// Rule: isFromConnector
// ---------------------------------------------------------------------------

type IsFromConnectorParams = { connector: string };

const isFromConnectorParamsSchema: z.ZodType<IsFromConnectorParams> = z.object({
  connector: z
    .string()
    .describe('Source connector to match (e.g., watsonx, internal-registry)'),
});

/**
 * Conditional permission rule that filters AI catalog assets by their
 * source connector annotation (`rhdh.io/ai-asset-source`).
 *
 * @internal
 */
export const isFromConnector = createPermissionRule({
  name: 'isFromConnector',
  description:
    'Matches AI assets by their source connector (e.g., watsonx, internal-registry)',
  resourceRef: aiCatalogAssetPermissionResourceRef,
  paramsSchema: isFromConnectorParamsSchema,
  apply: (
    resource: AiCatalogAssetResource,
    { connector }: IsFromConnectorParams,
  ) => {
    const annotation =
      resource.metadata.annotations?.['rhdh.io/ai-asset-source'];
    return annotation === connector;
  },
  toQuery: ({ connector }: IsFromConnectorParams) => ({
    key: 'rhdh.io/ai-asset-source',
    values: [connector],
  }),
} as any) as unknown as PermissionRule<
  AiCatalogAssetResource,
  AiCatalogFilter,
  typeof AI_CATALOG_ASSET_RESOURCE_TYPE,
  IsFromConnectorParams
>;

// ---------------------------------------------------------------------------
// Rule: isInTenant
// ---------------------------------------------------------------------------

type IsInTenantParams = { tenant: string };

const isInTenantParamsSchema: z.ZodType<IsInTenantParams> = z.object({
  tenant: z
    .string()
    .describe('Tenant identity to match (namespace or tenant annotation)'),
});

/**
 * Conditional permission rule that filters AI catalog assets by tenant
 * identity. Checks both the entity namespace and the
 * `rhdh.io/ai-asset-tenant` annotation.
 *
 * @internal
 */
export const isInTenant = createPermissionRule({
  name: 'isInTenant',
  description:
    'Matches AI assets by their tenant identity (namespace or annotation)',
  resourceRef: aiCatalogAssetPermissionResourceRef,
  paramsSchema: isInTenantParamsSchema,
  apply: (resource: AiCatalogAssetResource, { tenant }: IsInTenantParams) => {
    // Check namespace first
    const namespace = resource.metadata.namespace ?? 'default';
    if (namespace === tenant) {
      return true;
    }
    // Fall back to tenant annotation
    const annotation =
      resource.metadata.annotations?.['rhdh.io/ai-asset-tenant'];
    return annotation === tenant;
  },
  toQuery: ({ tenant }: IsInTenantParams) => ({
    key: 'rhdh.io/ai-asset-tenant',
    values: [tenant],
  }),
} as any) as unknown as PermissionRule<
  AiCatalogAssetResource,
  AiCatalogFilter,
  typeof AI_CATALOG_ASSET_RESOURCE_TYPE,
  IsInTenantParams
>;

// ---------------------------------------------------------------------------
// Exported rules collection
// ---------------------------------------------------------------------------

/**
 * All AI catalog conditional permission rules.
 *
 * @internal
 */
export const aiCatalogRules = {
  isAiAssetCategory,
  isFromConnector,
  isInTenant,
};
