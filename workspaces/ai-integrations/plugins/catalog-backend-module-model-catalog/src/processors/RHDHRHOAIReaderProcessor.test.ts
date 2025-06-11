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
 *
 * Assisted-by: watsonx Code Assistant
 */

import { RHDHRHOAIReaderProcessor } from './RHDHRHOAIReaderProcessor';
import {
  UrlReaderService,
  RootConfigService,
  LoggerService,
} from '@backstage/backend-plugin-api'; // Replace with actual paths
import { LocationSpec } from '@backstage/plugin-catalog-common'; // Replace with actual paths
import { ModelCatalogConfig } from '../providers/types';
import {
  ParseCatalogJSON,
  GenerateCatalogEntities,
} from '../clients/ModelCatalogGenerator'; // Replace with actual paths
import { mockServices } from '@backstage/backend-test-utils';
import {
  ComponentEntity,
  Entity,
  ResourceEntity,
} from '@backstage/catalog-model';
import { ModelCatalog } from '@redhat-ai-dev/model-catalog-types';

jest.mock('../clients/ModelCatalogGenerator', () => ({
  ...jest.requireActual('../clients/ModelCatalogGenerator'),
  GenerateCatalogEntities: jest.fn().mockReturnValue({}),
  ParseCatalogJSON: jest.fn().mockReturnValue({}),
}));

describe('RHDHRHOAIReaderProcessor', () => {
  let reader: UrlReaderService;
  let config: RootConfigService;
  let logger: LoggerService;
  let processor: RHDHRHOAIReaderProcessor;

  beforeEach(() => {
    reader = mockServices.urlReader.mock();
    config = mockServices.rootConfig.mock();
    logger = mockServices.logger.mock();

    const mockConfig: ModelCatalogConfig[] = [
      { id: 'production', baseUrl: 'http://example.com' },
    ];

    processor = new RHDHRHOAIReaderProcessor(reader, config, logger);

    // Mock the modelCatalogConfigs property
    Object.defineProperty(processor, 'modelCatalogConfigs', {
      value: mockConfig,
    });
  });

  describe('getProcessorName', () => {
    it('should return the correct processor name', () => {
      expect(processor.getProcessorName()).toBe('RHDHRHOAIReaderProcessor');
    });
  });

  describe('readLocation', () => {
    const location: LocationSpec = {
      type: 'rhdh-rhoai-bridge',
      target: 'http://example.com',
    };

    const emitMock: jest.Mock = jest.fn();

    beforeEach(() => {
      processor.readLocation(location, false, emitMock);
    });

    it('should log and skip non-bridge locations', () => {
      const nonBridgeLocation = {
        type: 'non-bridge',
        target: 'http://example.com',
      };
      emitMock.mockReturnValue(true);

      processor.readLocation(nonBridgeLocation, false, emitMock);
      expect(logger.info).toHaveBeenCalledWith(
        `skipping non bridge location non-bridge:${nonBridgeLocation.target}`,
      );
    });

    it('should skip registered locations for startup processing', () => {
      const registeredLocation = {
        type: 'rhdh-rhoai-bridge',
        target: 'http://example.com',
      };

      emitMock.mockReturnValue(true);

      processor.readLocation(registeredLocation, false, emitMock);
      expect(logger.info).toHaveBeenCalledWith(
        `RHDHRHOAIReaderProcessor skipping bridge location rhdh-rhoai-bridge:${registeredLocation.target} because it is registered for startup processing`,
      );
    });

    it('should read data and emit entities for bridge locations', async () => {
      const newLoc: LocationSpec = {
        type: 'rhdh-rhoai-bridge',
        target: 'http://example.com/newloc',
      };

      const mockData = new Promise(resolve => {
        resolve({ buffer: () => Promise.resolve(new Uint8Array([1, 2, 3])) });
      });

      const mockModelCatalog: ModelCatalog = {
        models: [
          {
            name: 'ibm-granite',
            description: 'IBM Granite model',
            lifecycle: 'production',
            owner: 'example-user',
          },
        ],
        modelServer: {
          name: 'vllm',
          description: 'vLLM model server running granite',
          lifecycle: 'production',
          owner: 'example-user',
        },
      };

      const mockResourceEntity: ResourceEntity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Resource',
        metadata: {
          name: 'ibm-granite',
          description: 'IBM Granite model',
        },
        spec: {
          owner: 'example-user',
          type: 'ai-model',
        },
      };
      const mockComponentEntity: ComponentEntity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'vllm',
          description: 'vLLM model server running granite',
        },
        spec: {
          owner: 'example-user',
          type: 'model-server',
          lifecycle: 'production',
        },
      };
      const mockEntities: Entity[] = [];
      mockEntities.push(mockResourceEntity);
      mockEntities.push(mockComponentEntity);

      (ParseCatalogJSON as jest.Mock).mockReturnValue(mockModelCatalog);
      (GenerateCatalogEntities as jest.Mock).mockReturnValue(mockEntities);
      (reader.readUrl as jest.Mock).mockReturnValue(mockData);

      await processor.readLocation(newLoc, false, emitMock);

      expect(reader.readUrl).toHaveBeenCalledWith('http://example.com/newloc');
      expect(emitMock).toHaveBeenCalledTimes(mockEntities.length + 1);

      for (const entity of mockEntities) {
        expect(emitMock).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'entity',
            entity,
            location: {
              type: 'rhdh-rhoai-bridge',
              target: 'http://example.com/newloc',
            },
            locationKey: `${newLoc.type}:${newLoc.target}`,
          }),
        );
      }
      expect(emitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'refresh',
          key: `${newLoc.type}:${newLoc.target}`,
        }),
      );
    });

    it('should emit a general error for any exceptions', async () => {
      const errorLoc: LocationSpec = {
        type: 'rhdh-rhoai-bridge',
        target: 'http://example.com/errorloc',
      };

      const error = new Error('Test error');
      (reader.readUrl as jest.Mock).mockRejectedValue(error);

      await processor.readLocation(errorLoc, false, emitMock);
      expect(emitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          location: errorLoc,
          error: new Error(
            'Unable to read rhdh-rhoai-bridge, Error: Test error',
          ),
        }),
      );
    });
  });
});
