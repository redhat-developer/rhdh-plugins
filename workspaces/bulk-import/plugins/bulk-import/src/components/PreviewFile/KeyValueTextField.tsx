/*
 * Copyright 2024 The Backstage Authors
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
 */ import React, { useState } from 'react';

import FormHelperText from '@mui/material/FormHelperText';
import TextField from '@mui/material/TextField';

import { PullRequestPreview, PullRequestPreviewData } from '../../types';

interface KeyValueTextFieldProps {
  repoId: string;
  label: string;
  name: string;
  value: string;
  onChange: (
    event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => void;
  formErrors: PullRequestPreviewData;
  setFormErrors: (pullRequest: PullRequestPreviewData) => void;
}

const validateKeyValuePairs = (value: string): string | null => {
  const keyValuePairs = value.split(';').map(pair => pair.trim());
  for (const pair of keyValuePairs) {
    if (pair) {
      const [key, val] = pair.split(':').map(part => part.trim());
      if (!key || !val) {
        return 'Each entry must have a key and a value separated by a colon.';
      }
    }
  }
  return null;
};

const KeyValueTextField: React.FC<KeyValueTextFieldProps> = ({
  repoId,
  label,
  name,
  value,
  onChange,
  setFormErrors,
  formErrors,
}) => {
  const [error, setError] = useState<string | null>(null);
  const fieldName = name.split('.').pop() ?? '';

  const removeError = () => {
    const err = { ...formErrors };
    if (err[repoId]) {
      delete err[repoId][fieldName as keyof PullRequestPreview];
    }
    setFormErrors(err);
  };

  const getUpdatedFormError = (
    validationError: string,
  ): PullRequestPreviewData => {
    return {
      ...formErrors,
      [repoId]: {
        ...(formErrors?.[repoId] || {}),
        [fieldName]: validationError,
      },
    };
  };

  const handleChange = (
    event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement, Element>,
  ) => {
    const validationError = validateKeyValuePairs(event.target.value);
    if (validationError) {
      setError(validationError);
      setFormErrors(getUpdatedFormError(validationError));
    } else {
      setError(null);
      removeError();
    }
    onChange(event);
  };

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
        onChange={handleChange}
        error={!!error}
        helperText={error}
      />
      <FormHelperText style={{ marginLeft: '0.8rem' }}>
        Use semicolon to separate {label.toLocaleLowerCase('en-US')}
      </FormHelperText>
    </div>
  );
};

export default KeyValueTextField;
