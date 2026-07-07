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
import { RiCheckLine, RiFileCopyLine } from '@remixicon/react';

import { useTranslation } from '../../../hooks/useTranslation';
import { getSpecField } from '../../../utils/entityHelpers';
import styles from './AdoptionCard.module.css';

export const AdoptionCard = () => {
  const { entity } = useEntity();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const specType = getSpecField(entity, 'type');

  const command =
    specType === 'skill' ? `npx skills add ${entity.metadata.name}` : undefined;

  const handleCopy = useCallback(() => {
    if (!command) return;
    navigator.clipboard.writeText(command).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {},
    );
  }, [command]);

  if (!command) return null;

  return (
    <Card>
      <CardHeader>
        <Text variant="title-small">{t('catalog.card.adoptionTitle')}</Text>
      </CardHeader>
      <CardBody>
        <Flex align="center" gap="2">
          <code className={styles.command}>{command}</code>
          <Button
            variant="tertiary"
            size="small"
            onPress={handleCopy}
            aria-label={t('catalog.card.copyAriaLabel')}
            iconStart={
              copied ? <RiCheckLine size={14} /> : <RiFileCopyLine size={14} />
            }
          >
            {copied ? t('catalog.card.copied') : t('catalog.card.copyCommand')}
          </Button>
        </Flex>
      </CardBody>
    </Card>
  );
};
