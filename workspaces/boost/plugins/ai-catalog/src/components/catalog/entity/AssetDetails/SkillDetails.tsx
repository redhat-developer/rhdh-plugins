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
import { Tag, TagGroup } from '@backstage/ui';

import { useTranslation } from '../../../../hooks/useTranslation';
import { DetailField } from './DetailField';
import type { SkillDetailsData } from './assetDetailsData';

interface SkillDetailsProps {
  readonly details: SkillDetailsData;
}

const ValueTags = ({
  label,
  values,
}: {
  readonly label: string;
  readonly values: string[];
}) => (
  <TagGroup
    items={values.map(value => ({ id: value, label: value }))}
    aria-label={label}
  >
    {item => <Tag size="small">{item.label}</Tag>}
  </TagGroup>
);

export const SkillDetails = ({ details }: SkillDetailsProps) => {
  const { t } = useTranslation();

  return (
    <>
      {details.disciplines.length > 0 && (
        <DetailField label={t('catalog.card.disciplinesLabel')}>
          <ValueTags
            label={t('catalog.card.disciplinesLabel')}
            values={details.disciplines}
          />
        </DetailField>
      )}
      {details.categories.length > 0 && (
        <DetailField label={t('catalog.card.categoriesLabel')}>
          <ValueTags
            label={t('catalog.card.categoriesLabel')}
            values={details.categories}
          />
        </DetailField>
      )}
      {details.agents.length > 0 && (
        <DetailField label={t('catalog.card.relatedAgentsLabel')}>
          <EntityRefLinks entityRefs={details.agents} hideIcons />
        </DetailField>
      )}
    </>
  );
};
