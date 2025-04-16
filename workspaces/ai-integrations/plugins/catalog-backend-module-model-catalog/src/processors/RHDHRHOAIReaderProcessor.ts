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
  processingResult,
  CatalogProcessor,
  CatalogProcessorEmit,
  CatalogProcessorResult,
  CatalogProcessorEntityResult,
} from '@backstage/plugin-catalog-node';
import {
  LoggerService,
  RootConfigService,
  UrlReaderService,
} from '@backstage/backend-plugin-api';

import { LocationSpec } from '@backstage/plugin-catalog-common';

import { ModelCatalogConfig } from '../providers/types';
import { readModelCatalogApiEntityConfigs } from '../providers/config';
import {
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION,
  Entity,
} from '@backstage/catalog-model';
import {
  GenerateCatalogEntities,
  ParseCatalogJSON,
} from '../clients/ModelCatalogGenerator';

/**
 * A processor that reads from the RHDH RHOAI Bridge
 *
 * @public
 * */
export class RHDHRHOAIReaderProcessor implements CatalogProcessor {
  private readonly reader: UrlReaderService;
  private readonly modelCatalogConfigs: ModelCatalogConfig[];
  private readonly logger: LoggerService;
  constructor(
    reader: UrlReaderService,
    config: RootConfigService,
    logger: LoggerService,
  ) {
    this.reader = reader;
    this.modelCatalogConfigs = readModelCatalogApiEntityConfigs(config);
    this.logger = logger;
  }

  /**
   * Retrieves the name of the catalog custom processor
   * @public
   */
  getProcessorName(): string {
    return 'RHDHRHOAIReaderProcessor';
  }

  /**
   * Retrieves the list of model catalog locations from the model catalog bridge
   * @public
   */
  async readLocation(
    location: LocationSpec,
    _optional: boolean,
    emit: CatalogProcessorEmit,
  ): Promise<boolean> {
    // Pick a custom location type string. A location will be
    // registered later with this type.
    if (location.type !== 'rhdh-rhoai-bridge') {
      this.logger.info(
        `skipping non bridge location ${location.type}:${location.target}`,
      );
      return false;
    }

    try {
      // as part of the life cycles of entities we will get called
      // when ModelCatalogResourceEntityProvider gets call on startup; leveraging
      // the config to bypass processing this location to avoid detection of conflicting
      // entity refs by the core catalog code
      for (const config of this.modelCatalogConfigs) {
        if (config.baseUrl === location.target) {
          this.logger.info(
            `RHDHRHOAIReaderProcessor skipping bridge location ${location.type}:${location.target} because it is registered for startup processing`,
          );
          // still return true to avoid warning from catalog about no processor being able to handle; we are just deferring to ModelCatalog entity provider
          return true;
        }
      }

      // Use the builtin reader facility to grab data from the
      // API. If you prefer, you can just use plain fetch here
      // (from the node-fetch package), or any other method of
      // your choosing.
      // TODO eventually we will want to take the k8s credentials provided to
      // backstage and its k8s plugin and supply them to the bridge
      // for potential auth and access control checks (i.e. SARs) with the kubeflow MR
      const data = await this.reader.readUrl(location.target);
      const response = [{ url: location.target, data: await data.buffer() }];
      const parseResults: CatalogProcessorResult[] = [];
      // Repeatedly call emit(processingResult.entity(location, <entity>))

      for (const item of response) {
        const modelCatalog = ParseCatalogJSON(item.data.toString());
        let entities: Entity[] = [];

        entities = GenerateCatalogEntities(modelCatalog);
        entities.forEach(entity => {
          const locKey = `${location.type}:${location.target}`;
          const parseResult: CatalogProcessorEntityResult = {
            type: 'entity',
            entity: entity,
            location: { type: location.type, target: item.url },
            locationKey: locKey,
          };

          // ToDo: We can probably handle this in the generator now
          if (parseResult.entity.metadata.annotations === undefined) {
            parseResult.entity.metadata.annotations = {
              [ANNOTATION_LOCATION]: locKey,
              [ANNOTATION_ORIGIN_LOCATION]: locKey,
            };
          } else {
            parseResult.entity.metadata.annotations[ANNOTATION_LOCATION] =
              locKey;
            parseResult.entity.metadata.annotations[
              ANNOTATION_ORIGIN_LOCATION
            ] = locKey;
          }
          parseResults.push(parseResult);
          emit(parseResult);
        });
        emit(processingResult.refresh(`${location.type}:${location.target}`));
      }
    } catch (error) {
      const message = `Unable to read ${location.type}, ${error}`.substring(
        0,
        5000,
      );
      // TODO when we enable cache this is how UrlReaderPRocessor.ts in core backstage handles errors
      // if (error.name === 'NotModifiedError' && cacheItem) {
      //   for (const parseResult of cacheItem.value) {
      //     emit(parseResult);
      //   }
      //   emit(processingResult.refresh(`${location.type}:${location.target}`));
      //   await cache.set(CACHE_KEY, cacheItem);
      // } else if (error.name === 'NotFoundError') {
      //   if (!optional) {
      //     emit(processingResult.notFoundError(location, message));
      //   }
      // } else {
      //   emit(processingResult.generalError(location, message));
      // }
      emit(processingResult.generalError(location, message));
    }

    return true;
  }
}
