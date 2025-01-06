/*
 * Copyright 2025 The Backstage Authors
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
import { Config } from '@backstage/config';
import {
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';

export class MarketplaceOCIProvider implements EntityProvider {
  static fromConfig(config: Config): MarketplaceOCIProvider[] {
    const configs = config.getOptionalConfigArray('marketplace.providers.npm');
    if (!configs) {
      return [];
    }
    return [];
  }

  getProviderName(): string {
    return `MarketplaceOCIProvider:{this.config.id}`;
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    console.log('Connecting to OCI');
  }
}
