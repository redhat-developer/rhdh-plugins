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

import { Text } from '@backstage/ui';

import { useTranslation } from '../../../../hooks/useTranslation';
import { AvailableModels } from './AvailableModels';
import { DetailField } from './DetailField';
import type { ModelServerDetailsData } from './assetDetailsData';

interface ModelServerDetailsProps {
  readonly details: ModelServerDetailsData;
}

export const ModelServerDetails = ({ details }: ModelServerDetailsProps) => {
  const { t } = useTranslation();

  return (
    <>
      {details.serverType && (
        <DetailField label={t('catalog.card.serverTypeLabel')}>
          <Text variant="body-medium">{details.serverType}</Text>
        </DetailField>
      )}
      {details.requiresApiKey !== undefined && (
        <DetailField label={t('catalog.card.apiKeyLabel')}>
          <Text variant="body-medium">
            {details.requiresApiKey
              ? t('catalog.card.yes')
              : t('catalog.card.no')}
          </Text>
        </DetailField>
      )}
      {details.defaultModel && (
        <DetailField label={t('catalog.card.defaultModelLabel')}>
          <Text variant="body-medium">{details.defaultModel}</Text>
        </DetailField>
      )}
      {details.modelsAvailable.length > 0 && (
        <DetailField label={t('catalog.card.modelsTitle')}>
          <AvailableModels models={details.modelsAvailable} />
        </DetailField>
      )}
    </>
  );
};
