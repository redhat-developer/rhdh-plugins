## API Report File for "@red-hat-developer-hub/backstage-plugin-marketplace-common"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { AuthService } from '@backstage/backend-plugin-api';
import { CatalogApi } from '@backstage/catalog-client';
import { Entity } from '@backstage/catalog-model';
import { EntityFilterQuery } from '@backstage/catalog-client';
import { EntityFilterQuery as EntityFilterQuery_2 } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import { GetEntityFacetsRequest } from '@backstage/catalog-client';
import { GetEntityFacetsResponse } from '@backstage/catalog-client';
import { JsonObject } from '@backstage/types';
import { z } from 'zod';

// @public (undocumented)
export interface AppConfigExample extends JsonObject {
    // (undocumented)
    content: string | JsonObject;
    // (undocumented)
    title: string;
}

// @public (undocumented)
export const decodeFacetParams: (searchParams: URLSearchParams) => string[];

// @public (undocumented)
export const decodeFilterParams: (searchParams: URLSearchParams) => Record<string, string[]>;

// @public (undocumented)
export const decodeQueryParams: (queryString: string) => {
    facets?: string[] | undefined;
    filter?: Record<string, string[]> | undefined;
};

// @public (undocumented)
export const encodeFacetParams: (facets: string[]) => URLSearchParams;

// @public (undocumented)
export const encodeFilterParams: (filter: EntityFilterQuery_2) => URLSearchParams;

// @public (undocumented)
export const encodeQueryParams: (options?: {
    filter?: EntityFilterQuery_2;
    facets?: string[];
}) => string;

// @public (undocumented)
export const EntityFacetSchema: z.ZodObject<{
    filter: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>>;
    facets: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    facets: string[];
    filter?: Record<string, string | string[]> | undefined;
}, {
    facets: string[];
    filter?: Record<string, string | string[]> | undefined;
}>;

export { EntityFilterQuery }

// @public (undocumented)
export const EntityFilterQuerySchema: z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;

export { GetEntityFacetsRequest }

export { GetEntityFacetsResponse }

// @public (undocumented)
export enum InstallStatus {
    // (undocumented)
    Installed = "Installed",
    // (undocumented)
    NotInstalled = "NotInstalled"
}

// @public (undocumented)
export const MARKETPLACE_API_VERSION = "marketplace.backstage.io/v1alpha1";

// @public (undocumented)
export interface MarketplaceApi {
    // (undocumented)
    getEntityFacets(request: GetEntityFacetsRequest): Promise<GetEntityFacetsResponse>;
    // (undocumented)
    getPluginByName(name: string): Promise<MarketplacePlugin>;
    // (undocumented)
    getPluginListByName(name: string): Promise<MarketplacePluginList>;
    // (undocumented)
    getPluginLists(): Promise<MarketplacePluginList[]>;
    // (undocumented)
    getPlugins(): Promise<MarketplacePlugin[]>;
    // (undocumented)
    getPluginsByPluginListName(name: string): Promise<MarketplacePlugin[]>;
}

// @public (undocumented)
export class MarketplaceCatalogClient implements MarketplaceApi {
    constructor(options: MarketplaceCatalogClientOptions);
    // (undocumented)
    getEntityFacets(request: GetEntityFacetsRequest): Promise<GetEntityFacetsResponse>;
    // (undocumented)
    getPluginByName(name: string): Promise<MarketplacePlugin>;
    // (undocumented)
    getPluginListByName(name: string): Promise<MarketplacePluginList>;
    // (undocumented)
    getPluginLists(): Promise<MarketplacePluginList[]>;
    // (undocumented)
    getPlugins(): Promise<MarketplacePlugin[]>;
    // (undocumented)
    getPluginsByPluginListName(name: string): Promise<MarketplacePlugin[]>;
}

// @public (undocumented)
export type MarketplaceCatalogClientOptions = {
    auth?: AuthService;
    catalogApi: CatalogApi;
};

// @public (undocumented)
export enum MarketplaceKinds {
    // (undocumented)
    package = "Package",
    // (undocumented)
    plugin = "Plugin",
    // (undocumented)
    pluginList = "PluginList"
}

// @public (undocumented)
export interface MarketplacePackage extends Entity {
    // (undocumented)
    spec?: MarketplacePackageSpec;
}

// @public (undocumented)
export interface MarketplacePackageBackstage extends JsonObject {
    // (undocumented)
    'supported-versions'?: string;
    // (undocumented)
    role?: string;
}

// @public (undocumented)
export interface MarketplacePackageSpec extends JsonObject {
    // (undocumented)
    appConfigExamples?: AppConfigExample[];
    // (undocumented)
    author?: string;
    // (undocumented)
    backstage?: MarketplacePackageBackstage;
    // (undocumented)
    dynamicArtifact?: string;
    // (undocumented)
    lifecycle?: string;
    // (undocumented)
    packageName: string;
    // (undocumented)
    support?: string;
}

// @public (undocumented)
export interface MarketplacePlugin extends Entity {
    // (undocumented)
    spec?: MarketplacePluginSpec;
}

// @public (undocumented)
export interface MarketplacePluginList extends Entity {
    // (undocumented)
    spec?: {
        plugins: string[];
    } & MarketplacePluginSpec;
}

// @public (undocumented)
export type MarketplacePluginPackage = {
    name: string;
    version?: string;
    backstage?: {
        role?: string;
        'supported-versions'?: string;
    };
    distribution?: string;
};

// @public (undocumented)
export interface MarketplacePluginSpec extends JsonObject {
    // (undocumented)
    categories?: string[];
    // (undocumented)
    description?: string;
    // (undocumented)
    developer?: string;
    // (undocumented)
    highlights?: string[];
    // (undocumented)
    icon?: string;
    // (undocumented)
    installation?: {
        markdown?: string;
        appconfig?: string;
    };
    // (undocumented)
    installStatus?: keyof typeof InstallStatus;
    // (undocumented)
    packages?: (string | MarketplacePluginPackage)[];
}

```
