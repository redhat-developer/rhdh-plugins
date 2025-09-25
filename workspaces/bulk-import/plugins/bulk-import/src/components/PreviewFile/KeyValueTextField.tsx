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

import type { FocusEvent } from 'react';

import FormHelperText from '@mui/material/FormHelperText';
import TextField from '@mui/material/TextField';

import { useTranslation } from '../../hooks/useTranslation';

interface KeyValueTextFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (event: FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  fieldError: string;
}

const KeyValueTextField = ({
  label,
  name,
  value,
  onChange,
  fieldError,
}: KeyValueTextFieldProps) => {
  const { t } = useTranslation();

  return (
    <div>
      <TextField
        multiline
        label={label}
        placeholder={t('previewFile.keyValuePlaceholder')}
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
        {t('previewFile.useSemicolonSeparator' as any, {
          label: label.toLocaleLowerCase('en-US'),
        })}
      </FormHelperText>
    </div>
  );
};

export default KeyValueTextField;
