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

import type { Config } from '@backstage/config';
import type {
  AuthService,
  DiscoveryService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { JIRA_CONFIG_PATH } from '../constants';
import { JiraClient } from '../clients/base';
import { JiraDataCenterClientStrategy } from '../strategies/JiraDataCenterClientStrategy';
import { JiraCloudClientStrategy } from '../strategies/JiraCloudClientStrategy';
import {
  ConnectionStrategy,
  DirectConnectionStrategy,
  ProxyConnectionStrategy,
} from '../strategies/ConnectionStrategy';
import { Product } from './types';

export class JiraClientFactory {
  static fromConfig(
    config: Config,
    options: {
      auth: AuthService;
      discovery: DiscoveryService;
      logger: LoggerService;
    },
  ): JiraClient {
    const jiraConfig = config.getConfig(JIRA_CONFIG_PATH);
    const proxyPath = jiraConfig.getOptionalString('proxyPath');

    let connectionStrategy: ConnectionStrategy;
    if (proxyPath) {
      connectionStrategy = new ProxyConnectionStrategy(
        proxyPath,
        options.auth,
        options.discovery,
      );
    } else {
      connectionStrategy = new DirectConnectionStrategy(
        jiraConfig.getString('baseUrl'),
        jiraConfig.getString('token'),
        jiraConfig.getString('product') as Product,
      );
    }

    const product = jiraConfig.getString('product');

    switch (product) {
      case 'datacenter':
        return new JiraDataCenterClientStrategy(
          connectionStrategy,
          options.logger,
        );
      case 'cloud':
        return new JiraCloudClientStrategy(connectionStrategy, options.logger);
      default:
        throw new Error(
          `Invalid Jira product: ${product}. Valid products for 'jira.product' are: datacenter, cloud`,
        );
    }
  }
}
