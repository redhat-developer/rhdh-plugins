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

import { useEntity } from '@backstage/plugin-catalog-react';
import { usePermission } from '@backstage/plugin-permission-react';
import { Flex, Link, Skeleton, Text } from '@backstage/ui';
import { boostAiCatalogUsageDocsPermission } from '@red-hat-developer-hub/backstage-plugin-boost-common';

import { useTranslation } from '../../../hooks/useTranslation';
import { getSpecField } from '../../../utils/entityHelpers';

export const UsageTab = () => {
  const { entity } = useEntity();
  const { t } = useTranslation();
  const { loading, allowed } = usePermission({
    permission: boostAiCatalogUsageDocsPermission,
  });

  if (loading) {
    return (
      <Flex direction="column" gap="4" p="4">
        <Skeleton width="40%" height={20} />
        <Skeleton width="70%" height={16} />
      </Flex>
    );
  }

  if (!allowed) {
    const owner = getSpecField(entity, 'owner');
    return (
      <Flex direction="column" gap="4" p="4">
        <Text variant="title-small">{t('catalog.tab.usageTitle')}</Text>
        <Text variant="body-medium" color="secondary">
          {t('catalog.tab.usagePermissionDenied')}
        </Text>
        {owner && (
          <Link href={`/catalog/default/group/${owner}`}>
            {t('catalog.tab.usageContactOwner')}
          </Link>
        )}
      </Flex>
    );
  }

  const hasTechDocs = Boolean(
    entity.metadata.annotations?.['backstage.io/techdocs-ref'],
  );
  const links = entity.metadata.links ?? [];

  return (
    <Flex direction="column" gap="4" p="4">
      <Text variant="title-small">{t('catalog.tab.usageTitle')}</Text>

      {hasTechDocs && (
        <Flex direction="column" gap="2">
          <Text variant="body-small" color="secondary">
            {t('catalog.tab.usageDocumentation')}
          </Text>
          <Link
            href={`/docs/${entity.metadata.namespace ?? 'default'}/${entity.kind.toLowerCase()}/${entity.metadata.name}`}
          >
            {t('catalog.tab.usageViewTechDocs')}
          </Link>
        </Flex>
      )}

      {links.length > 0 && (
        <Flex direction="column" gap="2">
          <Text variant="body-small" color="secondary">
            {t('catalog.tab.usageExternalLinks')}
          </Text>
          {links.map(link => (
            <Link
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.title ?? link.url}
            </Link>
          ))}
        </Flex>
      )}

      {!hasTechDocs && links.length === 0 && (
        <Text variant="body-medium" color="secondary">
          {t('catalog.tab.usageNoDocumentation')}
        </Text>
      )}
    </Flex>
  );
};
