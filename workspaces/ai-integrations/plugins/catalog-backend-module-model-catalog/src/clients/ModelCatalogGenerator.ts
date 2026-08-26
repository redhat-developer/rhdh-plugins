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
import { ModelCatalog } from '@redhat-ai-dev/model-catalog-types';
import { Entity, makeValidator } from '@backstage/catalog-model';
import { LoggerService } from '@backstage/backend-plugin-api';
import type { AiModelServerApiEntity } from '@red-hat-developer-hub/backstage-plugin-catalog-model-ai-model-server';

const TECHDOCS_KEY = 'techdocs';

const SYSTEM_ANNOTATION = 'rhdh.io/system';
const SERVER_TYPE_ANNOTATION = 'rhdh.io/serverType';
const DEFAULT_ANNOTATION = 'rhdh.io/default';
const OWNER_ANNOTATION = 'rhdh.io/owner';
const LIFECYCLE_ANNOTATION = 'rhdh.io/lifecycle';

function isModelCatalog(o: any): o is ModelCatalog {
  return 'models' in o || 'modelServer' in o;
}

export function ParseCatalogJSON(jsonStr: string): ModelCatalog {
  const modelCatalog: ModelCatalog = JSON.parse(jsonStr);
  if (isModelCatalog(modelCatalog)) {
    return modelCatalog;
  }
  throw new Error(`model catalog JSON in unexpected format: ${jsonStr}`);
}

export function GenerateCatalogEntities(
  modelCatalog: ModelCatalog,
  svcUrl?: string,
  logger?: LoggerService,
): Entity[] {
  if (!modelCatalog.modelServer) {
    logger?.debug(
      'ModelCatalog has no modelServer; skipping AiModelServerAPI generation',
    );
    return [];
  }

  if (!modelCatalog.modelServer.API?.url) {
    logger?.debug(
      'ModelCatalog modelServer has no API url; skipping AiModelServerAPI generation',
    );
    return [];
  }

  const modelServer = modelCatalog.modelServer;
  const models = modelCatalog.models;

  const tags = sanitizeTags(modelServer.tags ?? [], logger);
  if (modelServer.authentication === undefined || !modelServer.authentication) {
    tags.push('auth-not-required');
  } else {
    tags.push('auth-required');
  }

  const links: Array<{ title: string; url: string }> = [];
  if (modelServer.API) {
    links.push({ title: 'API', url: modelServer.API.url });
  }
  if (modelServer.homepageURL) {
    links.push({ title: 'Homepage', url: modelServer.homepageURL });
  }

  const annotations: Record<string, string> = {};

  // Copy API annotations
  if (modelServer.API?.annotations) {
    Object.assign(annotations, modelServer.API.annotations);
  }
  // Copy model server annotations (overrides API on conflict)
  if (modelServer.annotations) {
    Object.assign(annotations, modelServer.annotations);
  }

  // Remove control annotations that drive spec fields — they should
  // not leak into entity metadata.annotations.
  delete annotations[SYSTEM_ANNOTATION];
  delete annotations[SERVER_TYPE_ANNOTATION];
  delete annotations[DEFAULT_ANNOTATION];
  delete annotations[OWNER_ANNOTATION];
  delete annotations[LIFECYCLE_ANNOTATION];

  // Collect techdocs from models — use the first one found
  for (const model of models) {
    if (model.annotations?.[TECHDOCS_KEY]) {
      let techdocsUrl = model.annotations[TECHDOCS_KEY].trim();
      if (techdocsUrl !== '') {
        if (svcUrl && techdocsUrl.startsWith('/')) {
          techdocsUrl = svcUrl + techdocsUrl;
        }
        annotations['backstage.io/techdocs-ref'] = `url:${techdocsUrl}`;
        break;
      }
    }
  }

  // Collect per-model artifact links
  for (const model of models) {
    if (model.artifactLocationURL) {
      links.push({
        title: `${model.name} artifact`,
        url: model.artifactLocationURL,
      });
    }
  }

  // Read annotation-driven overrides for spec fields
  const systemOverride = modelServer.annotations?.[SYSTEM_ANNOTATION];
  const serverTypeOverride = modelServer.annotations?.[SERVER_TYPE_ANNOTATION];
  const defaultOverride = modelServer.annotations?.[DEFAULT_ANNOTATION];
  const ownerOverride = modelServer.annotations?.[OWNER_ANNOTATION];
  const lifecycleOverride = modelServer.annotations?.[LIFECYCLE_ANNOTATION];

  const entity: AiModelServerApiEntity = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'AiModelServerAPI',
    metadata: {
      name: sanitizeMetadataName(modelServer.name),
      description: modelServer.description,
      tags,
      links,
      ...(Object.keys(annotations).length > 0 && { annotations }),
    },
    spec: {
      type: 'ai-model-server',
      lifecycle: lifecycleOverride ?? modelServer.lifecycle,
      owner: `user:${ownerOverride ?? modelServer.owner}`,
      ...(systemOverride && { system: systemOverride }),
      serverType: serverTypeOverride ?? modelServer.API?.type ?? 'unknown',
      serverUrl: modelServer.API?.url ?? '',
      requiresApiKey: modelServer.authentication ?? false,
      models: {
        available: models.map(m => sanitizeMetadataName(m.name)),
        ...getDefaultModel(defaultOverride, models),
      },
    },
  };

  return [entity];
}

function getDefaultModel(
  defaultOverride: string | undefined,
  models: { name: string }[],
): { default: string } | Record<string, never> {
  if (defaultOverride) {
    return { default: sanitizeMetadataName(defaultOverride) };
  }
  if (models.length > 0) {
    return { default: sanitizeMetadataName(models[0].name) };
  }
  return {};
}

function sanitizeMetadataName(modelName: string): string {
  return modelName.replace(/\s/g, '');
}

function sanitizeTags(tags: string[], logger?: LoggerService): string[] {
  const sanitizedTags: string[] = [];
  tags.forEach(tag => {
    let sanitizedTag: string = tag;
    sanitizedTag = sanitizedTag.replace(/\s/g, '');

    if (!makeValidator().isValidTag(sanitizedTag)) {
      if (logger !== undefined) {
        logger.error(
          `invalid tag: ${sanitizedTag}. Tags are expected to be less than 63 characters and conform to: ^[a-z0-9:+#]+(\-[a-z0-9:+#]+)*$`,
        );
      }
      return;
    }
    sanitizedTags.push(sanitizedTag);
  });
  return sanitizedTags;
}
