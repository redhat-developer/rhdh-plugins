/*
 * Copyright The Backstage Authors
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

import React from 'react';

import { useQueryParamState } from '@backstage/core-components';

import Box from '@mui/material/Box';
import Select2 from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';

export interface SelectFilterProps {
  name: string;
  debounceTime?: number;
  label: string;
  items: SelectItem[];
}

export const SelectFilter = (props: SelectFilterProps) => {
  const [selected, setSelected] = useQueryParamState<SelectedItems | undefined>(
    props.name,
    props.debounceTime,
  );

  const onChange = (newSelected: SelectedItems) => {
    setSelected(newSelected === '' ? undefined : newSelected);
  };

  return (
    <Box pb={1} pt={1}>
      <Select
        label="Category"
        items={items}
        selected={selected}
        onChange={setSelected}
        multiple
      />

      <Typography component="label">
        <Typography variant="body2" color="text.primary" fontWeight="bold">
          Category
        </Typography>

        <Select2
          // label="Category"
          // disableCloseOnSelect
          size="small"
          // IconComponent={<ExpandMoreIcon data-testid={`${name}-expand`} />}
          // popupIcon={}
          // PaperProps
          // MenuProps={}
          sx={{ width: '100%' }}
        >
          {categories?.map(category => (
            <MenuItem key={category.value}>
              <Checkbox checked={false} />
              <ListItemText primary={category.value} />
              <Typography variant="body2" color="text.secondary">
                {category.count}
              </Typography>
            </MenuItem>
          ))}
        </Select2>
      </Typography>
    </Box>
  );
};
