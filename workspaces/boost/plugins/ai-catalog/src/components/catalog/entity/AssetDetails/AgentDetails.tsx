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

import { EntityRefLinks } from '@backstage/plugin-catalog-react';
import { Text } from '@backstage/ui';

import { useTranslation } from '../../../../hooks/useTranslation';
import { AvailableModels } from './AvailableModels';
import { DetailField } from './DetailField';
import { HandoffTargets } from './HandoffTargets';
import type { AgentDetailsData } from './assetDetailsData';

interface AgentDetailsProps {
  readonly details: AgentDetailsData;
}

export const AgentDetails = ({ details }: AgentDetailsProps) => {
  const { t } = useTranslation();

  return (
    <>
      {details.model && (
        <DetailField label={t('catalog.card.modelTitle')}>
          <Text variant="body-medium">{details.model}</Text>
        </DetailField>
      )}
      {details.modelsAvailable.length > 0 && (
        <DetailField label={t('catalog.card.modelsTitle')}>
          <AvailableModels models={details.modelsAvailable} />
        </DetailField>
      )}
      {details.tools.length > 0 && (
        <DetailField label={t('catalog.card.toolsLabel')}>
          <EntityRefLinks entityRefs={details.tools} hideIcons />
        </DetailField>
      )}
      {details.enableRAG !== undefined && (
        <DetailField label={t('catalog.card.ragEnabledLabel')}>
          <Text variant="body-medium">
            {details.enableRAG ? t('catalog.card.yes') : t('catalog.card.no')}
          </Text>
        </DetailField>
      )}
      {details.handoffDescription && (
        <DetailField label={t('catalog.card.handoffDescriptionTitle')}>
          <Text variant="body-medium">{details.handoffDescription}</Text>
        </DetailField>
      )}
      {details.handoffRefs.length > 0 && (
        <DetailField label={t('catalog.card.handoffTargetsTitle')}>
          <HandoffTargets refs={details.handoffRefs} />
        </DetailField>
      )}
    </>
  );
};
