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

import { useCallback, useState } from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import { Button, Card, CardBody, CardHeader, Flex, Text } from '@backstage/ui';
import CheckOutlined from '@mui/icons-material/CheckOutlined';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import DownloadOutlined from '@mui/icons-material/DownloadOutlined';

import { useTranslation } from '../../../hooks/useTranslation';
import { getAdoptionAction } from '../../../utils/entityHelpers';
import styles from './AdoptionCard.module.css';

export const AdoptionCard = () => {
  const { entity } = useEntity();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const action = getAdoptionAction(entity);

  const handleCopy = useCallback(() => {
    if (!action || action.type !== 'copy') return;
    navigator.clipboard.writeText(action.value).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {
        // eslint-disable-next-line no-console
        console.warn('Failed to copy to clipboard');
      },
    );
  }, [action]);

  if (!action) return null;

  return (
    <Card>
      <CardHeader>
        <Text variant="title-small">{t('catalog.card.adoptionTitle')}</Text>
      </CardHeader>
      <CardBody>
        {action.type === 'copy' ? (
          <Flex align="center" gap="2">
            <code className={styles.command}>{action.value}</code>
            <Button
              variant="tertiary"
              size="small"
              onPress={handleCopy}
              aria-label={t('catalog.card.copyAriaLabel')}
              iconStart={
                copied ? (
                  <CheckOutlined fontSize="small" />
                ) : (
                  <ContentCopyOutlined fontSize="small" />
                )
              }
            >
              {copied
                ? t('catalog.card.copied')
                : t('catalog.card.copyCommand')}
            </Button>
          </Flex>
        ) : (
          <Button
            variant="tertiary"
            onPress={() => window.open(action.value, '_blank')}
            iconStart={<DownloadOutlined fontSize="small" />}
          >
            {t('catalog.card.adoptionDownloadZip')}
          </Button>
        )}
      </CardBody>
    </Card>
  );
};
