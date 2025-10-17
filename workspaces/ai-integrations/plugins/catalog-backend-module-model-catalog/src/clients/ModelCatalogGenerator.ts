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
  ModelCatalog,
  Model,
  ModelServer,
  API,
} from '@redhat-ai-dev/model-catalog-types';
import {
  Entity,
  ComponentEntity,
  ApiEntity,
  ResourceEntity,
  makeValidator,
} from '@backstage/catalog-model';
import { LoggerService } from '@backstage/backend-plugin-api';

function isModelCatalog(o: any): o is ModelCatalog {
  return 'models' in o || 'modelServer' in o;
}

export function ParseCatalogJSON(jsonStr: string): ModelCatalog {
  const modelCatalog: ModelCatalog = JSON.parse(jsonStr);
  if (isModelCatalog(modelCatalog)) {
    // do something with now correctly typed object
    return modelCatalog;
  }
  throw new Error(`model catalog JSON in unexpected format: ${jsonStr}`);
}

// Generate the Backstage catalog entities that correspond to the given model catalog json object
// Note: These entities will need to have their location and origin location annotations set before ingestion into the catalog
// An optional logger parameter can be passed if you wish log output from the generator
export function GenerateCatalogEntities(
  modelCatalog: ModelCatalog,
  logger?: LoggerService,
): Entity[] {
  // Generate the Resource entities for the Model(s)
  let modelCatalogEntities: Entity[] = [];
  const models: Model[] = modelCatalog.models;
  modelCatalogEntities = modelCatalogEntities.concat(
    GenerateModelResourceEntities(models, modelCatalog.modelServer, logger),
  );

  // Generate the Model Server and Model Server APi entity, if present
  if (modelCatalog.modelServer !== undefined) {
    const modelServer = modelCatalog.modelServer;
    modelCatalogEntities.push(
      GenerateModelServerComponentEntity(
        modelServer,
        modelCatalog.models,
        logger,
      ),
    );

    // If there's an exposed API present, generate that entity as well, and update the model server entity accordingly
    if (modelServer.API !== undefined) {
      const api: API = modelServer.API;
      modelCatalogEntities.push(
        GenerateModelServerAPI(api, modelServer, logger),
      );
    }
  }

  return modelCatalogEntities;
}

export function GenerateModelResourceEntities(
  models: Model[],
  modelServer?: ModelServer,
  logger?: LoggerService,
): ResourceEntity[] {
  const modelResourceEntities: ResourceEntity[] = [];
  models.forEach(model => {
    const modelResourceEntity: ResourceEntity = {
      apiVersion: 'backstage.io/v1beta1',
      kind: 'Resource',
      metadata: {
        name: sanitizeMetadataName(model.name),
        description: `${model.description}`,
        tags: [],
        links: [],
      },
      spec: {
        owner: `user:${model.owner}`,
        type: 'ai-model',
      },
    };

    // Set optional parameters, if present
    if (model.tags !== undefined) {
      modelResourceEntity.metadata.tags = sanitizeTags(model.tags, logger);
    }
    if (model.artifactLocationURL !== undefined) {
      modelResourceEntity.metadata.links?.push({
        title: 'Artifact Location',
        url: `${model.artifactLocationURL}`,
      });
    }
    if (model.howToUseURL !== undefined) {
      modelResourceEntity.metadata.links?.push({
        title: 'How to use',
        url: `${model.howToUseURL}`,
      });
    }
    if (model.license !== undefined) {
      modelResourceEntity.metadata.links?.push({
        title: `License`,
        url: `${model.license}`,
      });
    }
    modelResourceEntity.spec.dependencyOf = [];
    if (modelServer !== undefined) {
      modelResourceEntity.spec.dependencyOf?.push(
        `component:${modelServer.name}`,
      );
    }

    // Handle any annotations present on the model resource
    if (model.annotations !== undefined) {
      // Initialize annotations object if needed
      if (modelResourceEntity.metadata.annotations === undefined) {
        modelResourceEntity.metadata.annotations = {};
      }

      // Copy all annotations from model to resource entity
      Object.keys(model.annotations).forEach(key => {
        // Special handling for TechDocs annotation
        if (key === 'TechDocs') {
          let techdocsUrl: string = model.annotations![key];
          techdocsUrl = techdocsUrl.trim();
          if (techdocsUrl !== '') {
            modelResourceEntity.metadata.annotations![
              'backstage.io/techdocs-ref'
            ] = `url:${techdocsUrl}`;
          }
        } else {
          // Copy all other annotations as-is
          modelResourceEntity.metadata.annotations![key] =
            model.annotations![key];
        }
      });
    }
    modelResourceEntities.push(modelResourceEntity);
  });

  return modelResourceEntities;
}

export function GenerateModelServerComponentEntity(
  modelServer: ModelServer,
  models: Model[],
  logger?: LoggerService,
): ComponentEntity {
  const modelServerComponent: ComponentEntity = {
    apiVersion: 'backstage.io/v1beta1',
    kind: 'Component',
    metadata: {
      name: sanitizeMetadataName(modelServer.name),
      description: `${modelServer.description}`,
      tags: [],
      links: [],
    },
    spec: {
      type: 'model-server',
      lifecycle: `${modelServer.lifecycle}`,
      owner: `user:${modelServer.owner}`,
    },
  };

  // Add the models to the model server as dependants
  modelServerComponent.spec.dependsOn = [];
  models.forEach(model => {
    modelServerComponent.spec.dependsOn?.push(`resource:${model.name}`);
  });

  // Configure optional parameters
  // Set optional parameters, if present
  if (modelServer.tags !== undefined) {
    modelServerComponent.metadata.tags = sanitizeTags(modelServer.tags, logger);
  }
  // Add authentication tag
  if (modelServer.authentication === undefined || !modelServer.authentication) {
    modelServerComponent.metadata.tags?.push('auth-not-required');
  } else {
    modelServerComponent.metadata.tags?.push('auth-required');
  }
  modelServerComponent.metadata.links = [];
  if (modelServer.API !== undefined) {
    modelServerComponent.metadata.links.push({
      title: `API`,
      url: `${modelServer.API.url}`,
    });
    modelServerComponent.spec.providesApis = [modelServer.name];

    // Copy annotations from API to component metadata if they exist
    if (modelServer.API.annotations !== undefined) {
      if (modelServerComponent.metadata.annotations === undefined) {
        modelServerComponent.metadata.annotations = {};
      }
      // Copy all key-value pairs from API annotations to component annotations
      Object.keys(modelServer.API.annotations).forEach(key => {
        modelServerComponent.metadata.annotations![key] =
          modelServer.API!.annotations![key];
      });
    }
  }
  if (modelServer.homepageURL !== undefined) {
    modelServerComponent.metadata.links.push({
      title: 'Homepage',
      url: `${modelServer.homepageURL}`,
    });
  }

  // Copy annotations from modelServer to component metadata if they exist
  if (modelServer.annotations !== undefined) {
    if (modelServerComponent.metadata.annotations === undefined) {
      modelServerComponent.metadata.annotations = {};
    }
    // Copy all key-value pairs from modelServer annotations to component annotations
    Object.keys(modelServer.annotations).forEach(key => {
      modelServerComponent.metadata.annotations![key] =
        modelServer.annotations![key];
    });
  }

  return modelServerComponent;
}

export function GenerateModelServerAPI(
  api: API,
  modelServer: ModelServer,
  logger?: LoggerService,
): ApiEntity {
  const modelServerAPIEntity: ApiEntity = {
    apiVersion: `backstage.io/v1beta1`,
    kind: `API`,
    metadata: {
      name: sanitizeMetadataName(modelServer.name),
      tags: [],
      links: [
        {
          url: `${api.url}`,
          title: `API`,
        },
      ],
    },
    spec: {
      type: `${api.type}`,
      owner: `user:${modelServer.owner}`,
      lifecycle: `${modelServer.lifecycle}`,
      definition: `${api.spec}`,
    },
  };

  if (api.tags !== undefined) {
    modelServerAPIEntity.metadata.tags = sanitizeTags(api.tags, logger);
  }
  // Add authentication tag
  if (modelServer.authentication === undefined || !modelServer.authentication) {
    modelServerAPIEntity.metadata.tags?.push('auth-not-required');
  } else {
    modelServerAPIEntity.metadata.tags?.push('auth-required');
  }
  return modelServerAPIEntity;
}

function sanitizeMetadataName(modelName: string): string {
  return modelName.replace(/\s/g, '');
}

function sanitizeTags(tags: string[], logger?: LoggerService): string[] {
  const sanitizedTags: string[] = [];
  tags.forEach(tag => {
    let sanitizedTag: string = tag;
    // Replace whitespace with empty character
    sanitizedTag = sanitizedTag.replace(/\s/g, '');

    // Call the Backstage tag validator and check if the tag conforms
    // If the tag is not valid, skip it
    if (!makeValidator().isValidTag(sanitizedTag)) {
      if (logger !== undefined) {
        logger.error(
          `invalid tag: ${sanitizedTag}. Tags are expected to be less than 63 characters and conform to: ^[a-z0-9:+#]+(\-[a-z0-9:+#]+)*$`,
        );
      }
      return; /* in typescript a return in a foreach skips to the next iteration */
    }
    sanitizedTags.push(sanitizedTag);
  });
  return sanitizedTags;
}
