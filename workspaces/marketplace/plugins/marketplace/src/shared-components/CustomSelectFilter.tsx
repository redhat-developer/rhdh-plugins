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

import type { SyntheticEvent } from 'react';
import { SelectItem } from '@backstage/core-components';
import Autocomplete from '@mui/material/Autocomplete';
import Checkbox from '@mui/material/Checkbox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import Typography from '@mui/material/Typography';

export interface CustomSelectItem extends SelectItem {
  helperText?: string;
  isBadge?: boolean;
  badgeColor?: string;
  count?: number;
  displayOrder?: number;
}

export interface CustomSelectFilterProps {
  label: string;
  helper?: string;
  items: CustomSelectItem[];
  selectedItems: CustomSelectItem[];
  onChange: (event: SyntheticEvent, value: CustomSelectItem[]) => void;
}

export const CustomSelectFilter = (props: CustomSelectFilterProps) => {
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
        isOptionEqualToValue={(option, value) => option.value === value.value}
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
                    c => c.label === option.label.toString(),
                  )
                    ? true
                    : selectedOption.selected
                }
              />
              {option.isBadge && (
                <TaskAltIcon
                  style={{ color: option.badgeColor }}
                  sx={{ marginRight: 1 }}
                />
              )}

              {option.helperText ? (
                <div style={{ flexGrow: 1 }}>
                  <Typography variant="body1">{option.label}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {option.helperText}
                  </Typography>
                </div>
              ) : (
                <div style={{ flexGrow: 1 }}>{option.label}</div>
              )}

              {option.count ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ pl: 1 }}
                >
                  {option.count}
                </Typography>
              ) : null}
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
