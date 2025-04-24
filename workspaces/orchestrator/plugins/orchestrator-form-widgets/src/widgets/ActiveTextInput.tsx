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
import React, { useState } from 'react';
import { JsonObject } from '@backstage/types';
import { Widget } from '@rjsf/utils';
import { JSONSchema7 } from 'json-schema';

import { FormContextData } from '../types';
import { FormControl, TextField } from '@material-ui/core';

export const ActiveTextInput: Widget<
  JsonObject,
  JSONSchema7,
  FormContextData
> = props => {
  // const formContext = useWrapperFormPropsContext();
  const { value, onChange, label } = props;

  // This value does not survive wizard step change (Next-Back), use formContext instead
  const [dummyValue, setDummyValue] = useState('');

  const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    onChange(event.target.value as string);
    setDummyValue(event.target.value as string);
  };

  // TODO: make it active

  return (
    <FormControl variant="outlined" fullWidth>
      <TextField
        value={value ?? ''}
        onChange={handleChange}
        label={`${label} - dummy (for demonstration): ${dummyValue}`}
      />
    </FormControl>
  );
};
