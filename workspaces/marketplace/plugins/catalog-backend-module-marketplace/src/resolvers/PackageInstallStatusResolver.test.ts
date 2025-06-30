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

import { MarketplacePackageInstallStatus } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import { PackageInstallStatusResolver } from './PackageInstallStatusResolver';
import { DynamicPackageInstallStatusResolver } from './DynamicPackageInstallStatusResolver';
import { LocalPackageInstallStatusResolver } from './LocalPackageInstallStatusResolver';
import { packageEntity } from '../../__fixtures__/mockData';

const mockDynamicPackageInstallStatusResolver = {
  getPackageInstallStatus: jest.fn(),
} as unknown as jest.Mocked<DynamicPackageInstallStatusResolver>;

const mockLocalPackageInstallStatusResolver = {
  getPackageInstallStatus: jest.fn(),
} as unknown as jest.Mocked<LocalPackageInstallStatusResolver>;

describe('PackageInstallStatusResolver', () => {
  let resolver: PackageInstallStatusResolver;

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new PackageInstallStatusResolver({
      dynamicPackageInstallStatusResolver:
        mockDynamicPackageInstallStatusResolver,
      localPackageInstallStatusResolver: mockLocalPackageInstallStatusResolver,
    });
  });

  describe('getPackageInstallStatus', () => {
    it('should return original installStatus if installStatus already set', () => {
      const packageWithStatus = {
        ...packageEntity,
        spec: {
          ...packageEntity.spec,
          installStatus: MarketplacePackageInstallStatus.Disabled,
        },
      };
      const result = resolver.getPackageInstallStatus(packageWithStatus);

      expect(result).toBe(MarketplacePackageInstallStatus.Disabled);
      expect(
        mockDynamicPackageInstallStatusResolver.getPackageInstallStatus,
      ).not.toHaveBeenCalled();
      expect(
        mockLocalPackageInstallStatusResolver.getPackageInstallStatus,
      ).not.toHaveBeenCalled();
    });

    it('should return installStatus from dynamic resolver over local resolver', () => {
      mockDynamicPackageInstallStatusResolver.getPackageInstallStatus.mockReturnValue(
        MarketplacePackageInstallStatus.Disabled,
      );
      mockLocalPackageInstallStatusResolver.getPackageInstallStatus.mockReturnValue(
        MarketplacePackageInstallStatus.UpdateAvailable,
      );
      const result = resolver.getPackageInstallStatus(packageEntity);

      expect(result).toBe(MarketplacePackageInstallStatus.Disabled);
      expect(
        mockLocalPackageInstallStatusResolver.getPackageInstallStatus,
      ).not.toHaveBeenCalled();
    });

    it('should fall back to local resolver when dynamic resolver returns undefined', () => {
      mockDynamicPackageInstallStatusResolver.getPackageInstallStatus.mockReturnValue(
        undefined,
      );
      mockLocalPackageInstallStatusResolver.getPackageInstallStatus.mockReturnValue(
        MarketplacePackageInstallStatus.UpdateAvailable,
      );
      const result = resolver.getPackageInstallStatus(packageEntity);

      expect(result).toBe(MarketplacePackageInstallStatus.UpdateAvailable);
    });

    it('should fall back to local resolver when dynamic resolver returns NotInstalled', () => {
      mockDynamicPackageInstallStatusResolver.getPackageInstallStatus.mockReturnValue(
        MarketplacePackageInstallStatus.NotInstalled,
      );
      mockLocalPackageInstallStatusResolver.getPackageInstallStatus.mockReturnValue(
        MarketplacePackageInstallStatus.Installed,
      );
      const result = resolver.getPackageInstallStatus(packageEntity);

      expect(result).toBe(MarketplacePackageInstallStatus.Installed);
    });

    it('should return undefined installStatus when both resolvers are unable to compute installStatus', () => {
      mockDynamicPackageInstallStatusResolver.getPackageInstallStatus.mockReturnValue(
        undefined,
      );
      mockLocalPackageInstallStatusResolver.getPackageInstallStatus.mockReturnValue(
        undefined,
      );
      const result = resolver.getPackageInstallStatus(packageEntity);

      expect(result).toBe(undefined);
    });
  });
});
