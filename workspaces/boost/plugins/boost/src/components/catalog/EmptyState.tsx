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

import { ButtonLink, Flex, Text } from '@backstage/ui';

import { useTranslation } from '../../hooks/useTranslation';
import styles from './AiCatalogPage.module.css';

export const EmptyState = () => {
  const { t } = useTranslation();
  return (
    <Flex
      direction="column"
      align="start"
      justify="center"
      p="6"
      className={styles.emptyState}
    >
      <Text variant="title-medium">{t('catalog.empty.title')}</Text>
      <Text variant="body-medium" color="secondary">
        {t('catalog.empty.description')}
      </Text>
      <ButtonLink
        href="https://docs.redhat.com/en/documentation/red_hat_developer_hub"
        target="_blank"
        rel="noopener noreferrer"
        variant="primary"
      >
        {t('catalog.empty.learnMore')}
      </ButtonLink>
    </Flex>
  );
};
