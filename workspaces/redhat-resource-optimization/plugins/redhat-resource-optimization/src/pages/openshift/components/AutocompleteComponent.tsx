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
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import {
  Autocomplete,
  AutocompleteChangeDetails,
  AutocompleteChangeReason,
} from '@material-ui/lab';

const useAutocompleteStyles = makeStyles(
  {
    root: {},
    label: {},
    input: { backgroundColor: '#ffffff' },
    fullWidth: { width: '100%' },
  },
  { name: 'AutocompleteComponent' },
);

type BaseProps = {
  label: string;
  options: string[];
  placeholder?: string;
  className?: string;
};

type SingleProps = BaseProps & {
  multiple?: false;
  value?: string;
  onChange?: (
    event: React.ChangeEvent<{}>,
    value: string | null,
    reason: AutocompleteChangeReason,
    details?: AutocompleteChangeDetails<string> | undefined,
  ) => void;
  onInputChange?: (
    event: React.ChangeEvent<{}>,
    value: string,
    reason: string,
  ) => void;
  loading?: boolean;
};

type MultipleProps = BaseProps & {
  multiple: true;
  value?: string[];
  onChange?: (
    event: React.ChangeEvent<{}>,
    value: string[],
    reason: AutocompleteChangeReason,
    details?: AutocompleteChangeDetails<string> | undefined,
  ) => void;
};

type AutocompleteComponentProps = SingleProps | MultipleProps;

/** @public */
export function AutocompleteComponent(props: AutocompleteComponentProps) {
  const classes = useAutocompleteStyles();
  const { label, options, placeholder, className } = props;

  return (
    <Box className={className ?? classes.root} pb={1} pt={1}>
      <Typography
        className={classes.label}
        variant="button"
        component="label"
        style={{ textTransform: 'none' }}
      >
        {label}
      </Typography>
      <Autocomplete
        options={options}
        multiple={Boolean((props as MultipleProps).multiple)}
        value={
          (props as any).value ??
          (Boolean((props as MultipleProps).multiple) ? [] : null)
        }
        onChange={(event, value, reason, details) => {
          if (props.onChange) {
            // Cast is safe because the callback shape matches the multiple flag
            (props.onChange as any)(event, value, reason, details);
          }
        }}
        onInputChange={(event, value, reason) => {
          if ((props as SingleProps).onInputChange) {
            (props as SingleProps).onInputChange!(event, value, reason);
          }
        }}
        loading={(props as SingleProps).loading ?? false}
        popupIcon={<ExpandMoreIcon data-testid="expand-icon" />}
        renderInput={params => (
          <TextField
            {...params}
            className={classes.input}
            variant="outlined"
            placeholder={placeholder}
          />
        )}
        size="medium"
      />
    </Box>
  );
}
