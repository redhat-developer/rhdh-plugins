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

import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
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
  const inputId = `extensions-filter-${props.label.toLowerCase().replace(/\s+/g, '-')}`;
  const rootRef = useRef<HTMLDivElement>(null);
  // Autocomplete sets the open list width from anchorEl.clientWidth only on
  // render. Re-render when the filter column resizes so counts are not left
  // clipped after the viewport grows again.
  const [, setMenuWidth] = useState(0);

  useEffect(() => {
    const element = rootRef.current;
    if (!element || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(entries => {
      const nextWidth = entries[0]?.contentRect.width;
      if (nextWidth) {
        setMenuWidth(nextWidth);
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      ref={rootRef}
      sx={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <InputLabel
        htmlFor={inputId}
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
        id={inputId}
        multiple
        disableCloseOnSelect
        aria-label={props.label}
        options={props.items}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        getOptionLabel={option => option.label}
        onChange={props.onChange}
        // Autocomplete sets menu width to the input; minWidth keeps labels
        // and counts readable when the filter column is very narrow.
        slotProps={{
          popper: {
            sx: {
              minWidth: 200,
            },
          },
        }}
        sx={{
          // Default option styles use nowrap + overflow:hidden, which clips
          // the trailing count when the filter column is narrow.
          '& .MuiAutocomplete-option': {
            alignItems: 'flex-start',
            whiteSpace: 'normal',
            boxSizing: 'border-box',
          },
        }}
        renderOption={(renderProps, option, selectedOption) => {
          const { key, ...optionProps } = renderProps;
          return (
            <Box
              component="li"
              key={key}
              {...optionProps}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                width: '100%',
                columnGap: 1,
              }}
            >
              <Checkbox
                icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                checkedIcon={<CheckBoxIcon fontSize="small" />}
                sx={{ flexShrink: 0, p: 0.5, mr: 0.5 }}
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
                  sx={{ flexShrink: 0, mt: 0.25 }}
                />
              )}

              {option.helperText ? (
                <Box sx={{ flex: '1 1 auto', minWidth: 0, overflow: 'hidden' }}>
                  <Typography variant="body1">{option.label}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {option.helperText}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ flex: '1 1 auto', minWidth: 0, overflow: 'hidden' }}>
                  {option.label}
                </Box>
              )}

              {typeof option.count === 'number' ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    pl: 0.5,
                    pt: 0.25,
                  }}
                >
                  {option.count}
                </Typography>
              ) : null}
            </Box>
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
