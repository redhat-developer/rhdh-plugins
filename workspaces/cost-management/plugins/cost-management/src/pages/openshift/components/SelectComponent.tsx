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

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { useThemeBackgroundColor } from '../../../hooks/useThemeBackgroundColor';

const useSelectStyles = makeStyles(
  {
    root: { paddingTop: 0, paddingBottom: 0 },
    label: { textTransform: 'none', fontWeight: 'bold' },
    formControl: {
      width: '100%',
      marginTop: 5,
      backgroundColor: 'transparent',
    },
  },
  {
    name: 'Select',
  },
);

type SelectProps = {
  label: string;
  options: string[];
  value?: string;
  onChange?: (event: React.ChangeEvent<{ value: unknown }>) => void;
  multiple?: boolean;
  freeSolo?: boolean;
  selectOnFocus?: boolean;
  clearOnBlur?: boolean;
  handleHomeEndKeys?: boolean;
  filterSelectedOptions?: boolean;
  placeholder?: string;
};

/** @public */
export function SelectComponent(props: SelectProps) {
  const classes = useSelectStyles();
  const { backgroundColor } = useThemeBackgroundColor();
  const {
    label,
    options,
    value,
    onChange,
    multiple = false,
    placeholder,
  } = props;

  return (
    <Box className={classes.root} pb={1} pt={1}>
      <Typography className={classes.label} variant="button" component="label">
        {label}
      </Typography>
      <FormControl
        className={classes.formControl}
        variant="outlined"
        hiddenLabel
        style={{ backgroundColor }}
      >
        <Select
          displayEmpty
          value={value || ''}
          onChange={onChange}
          multiple={multiple}
          IconComponent={ExpandMoreIcon}
          renderValue={(selected): React.ReactNode => {
            if (
              !selected ||
              (Array.isArray(selected) && selected.length === 0)
            ) {
              return (
                <Typography style={{ color: '#999' }}>
                  {placeholder || 'Select an option'}
                </Typography>
              );
            }
            if (Array.isArray(selected)) {
              return selected.join(', ');
            }
            return selected as React.ReactNode;
          }}
        >
          {options.map(option => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
