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

import { ButtonIcon, Flex, SearchField } from '@backstage/ui';

import { useTranslation } from '../../hooks/useTranslation';
import { BulkImportClearIcon } from '../bulkImportIcons';

export const RepositoriesSearchBar = ({
  value,
  onChange,
  activeOrganization,
  placeholder,
}: {
  value: string;
  onChange: (filter: string) => void;
  activeOrganization?: boolean;
  placeholder?: string;
}) => {
  const { t } = useTranslation();
  const ariaLabel = activeOrganization ? 'search-in-organization' : 'search';

  return (
    <Flex
      align="center"
      gap="2"
      style={{
        flexGrow: 1,
        paddingLeft: '21px',
        justifyContent: 'flex-end',
      }}
    >
      <SearchField
        data-testid={ariaLabel}
        aria-label={ariaLabel}
        placeholder={placeholder ?? t('addRepositories.searchPlaceholder')}
        autoComplete="off"
        value={value}
        onChange={onChange}
        size="small"
        style={{ flexGrow: 1, maxWidth: '100%' }}
      />
      {value ? (
        <ButtonIcon
          icon={<BulkImportClearIcon />}
          aria-label={t('addRepositories.clearSearch')}
          data-testid="clear-search"
          variant="tertiary"
          onPress={() => onChange('')}
        />
      ) : null}
    </Flex>
  );
};
