/*
 * Copyright The Backstage Authors
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

import { resolve } from 'path';
import { DynamicPluginsService } from './DynamicPluginsService';
import { ConfigReader } from '@backstage/config';
import { mockServices } from '@backstage/backend-test-utils';
import { MarketplacePackage } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import {
  mockTopologyPackage,
  mockMarketplacePackage,
} from '../../__fixtures__/mockData';

const logger = mockServices.logger.mock();

describe('DynamicPluginsService', () => {
  afterEach(jest.clearAllMocks);

  const dynamicPluginsRootDirectory = resolve(
    __dirname,
    '../../__fixtures__/dynamic-plugins-root',
  );

  const validConfig = new ConfigReader({
    dynamicPlugins: { rootDirectory: dynamicPluginsRootDirectory },
  });

  describe('initialize', () => {
    it('should initialize config', () => {
      const dynamicPluginsService = DynamicPluginsService.fromConfig({
        config: validConfig,
        logger,
      });
      dynamicPluginsService.initialize();
      expect(logger.info).not.toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should log info when no rootDirectory is configured', () => {
      const config = new ConfigReader({});
      const dynamicPluginsService = DynamicPluginsService.fromConfig({
        config,
        logger,
      });
      dynamicPluginsService.initialize();
      expect(logger.info).toHaveBeenCalledWith(
        `'dynamicPlugins.rootDirectory' is missing`,
      );
    });

    it('should log warn when config file is missing', () => {
      const rootDirectory2 = resolve(
        __dirname,
        '../../__fixtures__/dynamic-plugins-root-2',
      );
      const config = new ConfigReader({
        dynamicPlugins: {
          rootDirectory: rootDirectory2,
        },
      });
      const dynamicPluginsService = DynamicPluginsService.fromConfig({
        config,
        logger,
      });
      dynamicPluginsService.initialize();

      expect(logger.warn).toHaveBeenCalledWith(
        `File '${resolve(rootDirectory2, 'dynamic-plugins.final.yaml')}' is missing`,
      );
    });
  });

  describe('isPackageDisabledViaConfig', () => {
    it('should return True if package is disabled via config', () => {
      const dynamicPluginsService = DynamicPluginsService.fromConfig({
        config: validConfig,
        logger,
      });
      dynamicPluginsService.initialize();
      const result =
        dynamicPluginsService.isPackageDisabledViaConfig(mockTopologyPackage);
      expect(result).toBeTruthy();
    });

    it('should return False if package is not disabled via config', () => {
      const dynamicPluginsService = DynamicPluginsService.fromConfig({
        config: validConfig,
        logger,
      });
      dynamicPluginsService.initialize();
      const result = dynamicPluginsService.isPackageDisabledViaConfig(
        mockMarketplacePackage,
      );
      expect(result).toBeFalsy();
    });

    it('should return False if package is not defined in the config', () => {
      const dynamicPluginsService = DynamicPluginsService.fromConfig({
        config: validConfig,
        logger,
      });
      const nonexistentPackage = {
        spec: {
          dynamicArtifact:
            './dynamic-plugins/dist/backstage-community-plugin-nonexistent',
        },
      } as any as MarketplacePackage;

      dynamicPluginsService.initialize();
      const result =
        dynamicPluginsService.isPackageDisabledViaConfig(nonexistentPackage);
      expect(result).toBeFalsy();
    });

    it(`should throw error if package does not contain 'spec.dynamicArtefact'`, () => {
      const dynamicPluginsService = DynamicPluginsService.fromConfig({
        config: validConfig,
        logger,
      });
      const invalidPackage = {
        metadata: {
          name: 'backstage-community-plugin-topology',
        },
        spec: {
          packageName: '@backstage-community/plugin-topology',
        },
      } as any as MarketplacePackage;

      dynamicPluginsService.initialize();
      expect(() =>
        dynamicPluginsService.isPackageDisabledViaConfig(invalidPackage),
      ).toThrow(
        `Package ${invalidPackage.metadata.name} is missing 'spec.dynamicArtifact'`,
      );
    });
  });
});
