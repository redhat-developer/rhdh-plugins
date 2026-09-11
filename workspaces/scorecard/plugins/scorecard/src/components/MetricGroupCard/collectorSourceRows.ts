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

import type { CollectorMetadata } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { extractPluginName } from '../../utils';
import { MISSING_EVALUATION_BUCKET_KEY } from './thresholdBucketUtils';
import type { SourceRow } from './DataSourcesDialogColumns';

const pluginLabelFromCollectorId = (
  collectorId: string,
  unknownPlugin: string,
  pluginLabels: Record<string, string>,
): string => {
  const prefix = collectorId.split(/[.:]/)[0]?.toLowerCase();
  if (prefix && pluginLabels[prefix]) {
    return pluginLabels[prefix];
  }
  return extractPluginName(collectorId, unknownPlugin);
};

export const toCollectorSourceRows = (
  collectors: CollectorMetadata[],
  options: {
    metricId: string;
    lastSynced: string;
    unknownPlugin: string;
    emptyValue: string;
    unavailableStatus: string;
    pluginLabels: Record<string, string>;
    statusColor: string;
  },
): SourceRow[] =>
  collectors.map((collector, index) => ({
    id: String(index),
    plugin: pluginLabelFromCollectorId(
      collector.id,
      options.unknownPlugin,
      options.pluginLabels,
    ),
    metricId: options.metricId,
    metricDescription: collector.description,
    value: options.emptyValue,
    evaluationKey: MISSING_EVALUATION_BUCKET_KEY,
    statusLabel: options.unavailableStatus,
    statusIcon: '',
    statusColor: options.statusColor,
    lastSynced: options.lastSynced,
    thresholdExpression: null,
    isCollector: true,
  }));
