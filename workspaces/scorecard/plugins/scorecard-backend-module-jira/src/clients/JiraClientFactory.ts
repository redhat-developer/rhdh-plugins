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
import { JIRA_CONFIG_PATH } from '../constants';
import { JiraClient } from '../clients/base';
import { JiraDataCenterClient } from '../clients/JiraDataCenterClient';
import { JiraCloudClient } from '../clients/JiraCloudClient';

export class JiraClientFactory {
  static create(config: Config): JiraClient {
    const jiraConfig = config.getConfig(JIRA_CONFIG_PATH);
    const product = jiraConfig.getString('product');

    switch (product) {
      case 'datacenter':
        return new JiraDataCenterClient(config);
      case 'cloud':
        return new JiraCloudClient(config);
      default:
        throw new Error(
          `Invalid Jira product: ${product}. Valid products for 'jira.product' are: datacenter, cloud`,
        );
    }
  }
}
