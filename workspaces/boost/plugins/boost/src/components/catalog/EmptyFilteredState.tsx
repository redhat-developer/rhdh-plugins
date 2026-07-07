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

import { Button, Flex, Text } from '@backstage/ui';

import { useTranslation } from '../../hooks/useTranslation';

export const EmptyFilteredState = ({
  onClearFilters,
}: {
  onClearFilters: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <Flex direction="column" align="start" gap="3" p="6">
      <Text variant="title-small">{t('catalog.emptyFiltered.title')}</Text>
      <Text variant="body-medium" color="secondary">
        {t('catalog.emptyFiltered.description')}
      </Text>
      <Button variant="secondary" onPress={onClearFilters}>
        {t('catalog.emptyFiltered.clearFilters')}
      </Button>
    </Flex>
  );
};
