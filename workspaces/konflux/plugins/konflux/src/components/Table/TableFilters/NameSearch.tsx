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

import { SearchInput, ToolbarItem } from '@patternfly/react-core';
import { useState, useEffect } from 'react';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';

type Props = {
  nameSearch?: string;
  onNameSearch: (val: string) => void;
  isFetching: boolean;
  placeholder: string;
};

const DEBOUNCE_DELAY = 300;

export const NameSearch = ({
  nameSearch = '',
  onNameSearch,
  isFetching,
  placeholder,
}: Props) => {
  const [localValue, setLocalValue] = useState(nameSearch);

  const debouncedValue = useDebouncedValue(localValue, DEBOUNCE_DELAY);

  useEffect(() => {
    if (debouncedValue !== nameSearch) {
      onNameSearch(debouncedValue);
    }
  }, [debouncedValue, onNameSearch, nameSearch]);

  return (
    <ToolbarItem align={{ default: 'alignEnd' }} alignSelf="center">
      <SearchInput
        placeholder={placeholder}
        value={localValue}
        onChange={(_event, value) => setLocalValue(value)}
        disabled={isFetching}
        isDisabled={isFetching}
      />
    </ToolbarItem>
  );
};
