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

import { useMemo } from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import { Badge, Card, CardBody, CardHeader, Flex, Text } from '@backstage/ui';

import { useTranslation } from '../../../../hooks/useTranslation';
import { AgentDetails } from './AgentDetails';
import { DetailField } from './DetailField';
import { McpServerDetails } from './McpServerDetails';
import { ModelServerDetails } from './ModelServerDetails';
import { RuleDetails } from './RuleDetails';
import { SkillDetails } from './SkillDetails';
import {
  getAssetDetailsData,
  hasAssetDetails,
  type AssetTypeDetailsData,
} from './assetDetailsData';

const TypeDetails = ({
  details,
}: {
  readonly details: AssetTypeDetailsData;
}) => {
  switch (details.type) {
    case 'agent':
      return <AgentDetails details={details} />;
    case 'ai-model-server':
      return <ModelServerDetails details={details} />;
    case 'mcp-server':
      return <McpServerDetails details={details} />;
    case 'skill':
      return <SkillDetails details={details} />;
    case 'rule':
      return <RuleDetails details={details} />;
    default:
      return null;
  }
};

export const AssetDetailsCard = () => {
  const { entity } = useEntity();
  const { t } = useTranslation();
  const data = useMemo(() => getAssetDetailsData(entity), [entity]);

  if (!hasAssetDetails(data)) return null;

  return (
    <Card>
      <CardHeader>
        <Text variant="title-small">{t('catalog.card.assetDetailsTitle')}</Text>
      </CardHeader>
      <CardBody>
        <Flex direction="column" gap="3">
          {data.description && (
            <DetailField label={t('catalog.card.descriptionLabel')}>
              <Text variant="body-medium">{data.description}</Text>
            </DetailField>
          )}
          {data.rationale && (
            <DetailField label={t('catalog.card.rationaleLabel')}>
              <Text variant="body-medium">{data.rationale}</Text>
            </DetailField>
          )}
          {data.typeDetails && <TypeDetails details={data.typeDetails} />}
          {data.version && (
            <DetailField label={t('catalog.card.versionLabel')}>
              <Flex align="center">
                <Badge size="small">{data.version}</Badge>
              </Flex>
            </DetailField>
          )}
        </Flex>
      </CardBody>
    </Card>
  );
};
