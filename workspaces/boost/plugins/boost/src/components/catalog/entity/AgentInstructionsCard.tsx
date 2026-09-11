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

import { MarkdownContent } from '@backstage/core-components';
import { useEntity } from '@backstage/plugin-catalog-react';
import { Card, CardBody, CardHeader, Text } from '@backstage/ui';

import { useTranslation } from '../../../hooks/useTranslation';
import {
  getDistinctSpecField,
  getSpecField,
} from '../../../utils/entityHelpers';

export const AgentInstructionsCard = () => {
  const { entity } = useEntity();
  const { t } = useTranslation();

  if (getSpecField(entity, 'type')?.toLowerCase() !== 'agent') return null;

  const instructions = getDistinctSpecField(entity, 'instructions');
  if (!instructions) return null;

  return (
    <Card>
      <CardHeader>
        <Text variant="title-small">{t('catalog.card.instructionsTitle')}</Text>
      </CardHeader>
      <CardBody>
        <MarkdownContent content={instructions} />
      </CardBody>
    </Card>
  );
};
