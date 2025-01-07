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

import FormHelperText from '@mui/material/FormHelperText';
import TextField from '@mui/material/TextField';

interface KeyValueTextFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (
    event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => void;
  fieldError: string;
}

const KeyValueTextField = ({
  label,
  name,
  value,
  onChange,
  fieldError,
}: KeyValueTextFieldProps) => {
  return (
    <div>
      <TextField
        multiline
        label={label}
        placeholder="key1: value2; key2: value2"
        variant="outlined"
        margin="normal"
        fullWidth
        name={name}
        value={value}
        onChange={onChange}
        error={!!fieldError}
        helperText={fieldError}
      />
      <FormHelperText style={{ marginLeft: '0.8rem' }}>
        Use semicolon to separate {label.toLocaleLowerCase('en-US')}
      </FormHelperText>
    </div>
  );
};

export default KeyValueTextField;
