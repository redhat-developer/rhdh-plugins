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
import { SelectItem } from '@backstage/core-components';
import Autocomplete from '@mui/material/Autocomplete';
import Checkbox from '@mui/material/Checkbox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';

export interface BackstageSelectFilterProps {
  label: string;
  items: SelectItem[];
  selectedItems: SelectItem[];
  onChange: (event: React.SyntheticEvent, value: SelectItem[]) => void;
}

export const CustomSelectFilter = (props: BackstageSelectFilterProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <InputLabel
        sx={{
          margin: theme => theme.spacing(1, 0),
          transform: 'initial',
          fontWeight: 'bold',
          fontSize: theme => theme.typography.body2.fontSize,
          fontFamily: theme => theme.typography.fontFamily,
          color: theme => theme.palette.text.primary,
          '&.Mui-focused': {
            color: theme => theme.palette.text.primary,
          },
        }}
      >
        {props.label}
      </InputLabel>
      <Autocomplete
        multiple
        disableCloseOnSelect
        aria-label={props.label}
        options={props.items}
        getOptionLabel={option => option.label}
        onChange={props.onChange}
        renderOption={(renderProps, option, selectedOption) => {
          const { key, ...optionProps } = renderProps;
          return (
            <li key={key} {...optionProps}>
              <Checkbox
                icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                checkedIcon={<CheckBoxIcon fontSize="small" />}
                style={{ marginRight: 8 }}
                checked={
                  props.selectedItems.find(
                    c => c.value === option.value.toString(),
                  )
                    ? true
                    : selectedOption.selected
                }
              />
              {option.label}
            </li>
          );
        }}
        size="small"
        value={props.selectedItems}
        popupIcon={
          <ExpandMoreIcon
            // eslint-disable-next-line no-restricted-syntax
            data-testid={`select-${props.label.toLowerCase().split(' ').join('-')}`}
          />
        }
        renderInput={params => <TextField {...params} variant="outlined" />}
      />
    </Box>
  );
};
