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

import { stringifyEntityRef } from '@backstage/catalog-model';
import { CodeSnippet } from '@backstage/core-components';
import { useEntity } from '@backstage/plugin-catalog-react';
import { usePermission } from '@backstage/plugin-permission-react';
import { Button, Card, CardBody, CardHeader, Text } from '@backstage/ui';
import { RiDownload2Line, RiExternalLinkLine } from '@remixicon/react';

import { aiCatalogAssetAccessUsageDocsPermission } from '@red-hat-developer-hub/backstage-plugin-boost-common';

import { useTranslation } from '../../../hooks/useTranslation';
import { getUsageAction } from '../../../utils/usageActions';

export const UsageCard = () => {
  const { entity } = useEntity();
  const { t } = useTranslation();
  const { loading, allowed } = usePermission({
    permission: aiCatalogAssetAccessUsageDocsPermission,
    resourceRef: stringifyEntityRef(entity),
  });

  if (loading || !allowed) return null;

  const action = getUsageAction(entity);

  if (!action) return null;

  return (
    <Card>
      <CardHeader>
        <Text variant="title-small">{t('catalog.card.usageTitle')}</Text>
      </CardHeader>
      <CardBody>
        {action.type === 'copy' ? (
          <CodeSnippet
            language="bash"
            text={action.value}
            showCopyCodeButton
            wrapLongLines
            customStyle={{
              margin: 0,
              padding: 'var(--bui-space-3)',
              border: '1px solid var(--bui-border-1)',
              borderRadius: 'var(--bui-radius-2)',
              background: 'var(--bui-bg-neutral-2)',
            }}
          />
        ) : (
          <Button
            variant="tertiary"
            onPress={() =>
              window.open(action.value, '_blank', 'noopener,noreferrer')
            }
            iconStart={
              action.linkType === 'source' ? (
                <RiExternalLinkLine size={16} />
              ) : (
                <RiDownload2Line size={16} />
              )
            }
          >
            {action.linkType === 'source'
              ? t('catalog.card.usageViewSource')
              : t('catalog.card.usageDownloadZip')}
          </Button>
        )}
      </CardBody>
    </Card>
  );
};
