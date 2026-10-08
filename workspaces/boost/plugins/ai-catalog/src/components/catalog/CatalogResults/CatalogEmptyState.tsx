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

import { Button, ButtonLink, Flex, Text } from '@backstage/ui';
import { RiExternalLinkLine, RiRefreshLine } from '@remixicon/react';

import { useTranslation } from '../../../hooks/useTranslation';
import emptyStateIllustration from '../../../images/empty-state-illustration.png';
import styles from './CatalogResults.module.css';

interface CatalogEmptyStateProps {
  readonly onRefresh: () => void;
}

export const CatalogEmptyState = ({ onRefresh }: CatalogEmptyStateProps) => {
  const { t } = useTranslation();
  return (
    <Flex
      direction={{ initial: 'column', lg: 'row' }}
      align="center"
      justify={{ initial: 'start', lg: 'center' }}
      gap={{ initial: '4', lg: '10' }}
      p={{ initial: '4', lg: '8' }}
      className={styles.emptyState}
    >
      <Flex
        direction="column"
        align="start"
        gap="4"
        className={styles.emptyStateContent}
      >
        <Text variant="title-medium">{t('catalog.empty.title')}</Text>
        <Text
          variant="body-medium"
          color="secondary"
          className={styles.emptyStateDescription}
        >
          {t('catalog.empty.description')}
        </Text>
        <Flex gap="2" className={styles.emptyStateActions}>
          <ButtonLink
            href="https://docs.redhat.com/en/documentation/red_hat_developer_hub"
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
            iconEnd={<RiExternalLinkLine size={16} />}
          >
            {t('catalog.empty.learnMore')}
          </ButtonLink>
          <Button
            variant="secondary"
            onPress={onRefresh}
            iconStart={<RiRefreshLine size={16} />}
            className={styles.refreshButton}
          >
            {t('catalog.empty.refresh')}
          </Button>
        </Flex>
      </Flex>
      <img
        src={emptyStateIllustration}
        alt=""
        aria-hidden="true"
        className={styles.emptyStateIllustration}
      />
    </Flex>
  );
};
