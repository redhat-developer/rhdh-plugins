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
import React, { useEffect, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Autocomplete, { AutocompleteValue } from '@mui/material/Autocomplete';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';

import { JsonObject } from '@backstage/types';
import { JSONSchema7 } from 'json-schema';
import { OrchestratorFormContextProps } from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-api';
import { Widget } from '@rjsf/utils';

import {
  useTemplateUnitEvaluator,
  applySelectorArray,
  useFetch,
  useRetriggerEvaluate,
} from '../utils';
import { UiProps } from '../uiPropTypes';
import { ErrorText } from './ErrorText';

export const ActiveMultiSelect: Widget<
  JsonObject,
  JSONSchema7,
  OrchestratorFormContextProps
> = props => {
  const templateUnitEvaluator = useTemplateUnitEvaluator();
  const { id, name, label, value: rawValue, onChange, formContext } = props;
  const value = rawValue as string[];
  const formData = formContext?.formData;

  const uiProps = useMemo(
    () => (props.options.props ?? {}) as UiProps,
    [props.options.props],
  );

  const autocompleteSelector =
    uiProps['fetch:response:autocomplete']?.toString();

  const [localError] = useState<string | undefined>(
    autocompleteSelector
      ? undefined
      : `Missing fetch:response:autocomplete selector for ${id}`,
  );
  const [autocompleteOptions, setAutocompleteOptions] = useState<string[]>();

  const retrigger = useRetriggerEvaluate(
    templateUnitEvaluator,
    formData,
    /* This is safe retype, since proper checking of input value is done in the useRetriggerEvaluate() hook */
    uiProps['fetch:retrigger'] as string[],
  );

  const { data, error, loading } = useFetch(formData ?? {}, uiProps, retrigger);

  useEffect(() => {
    if (!data) {
      return;
    }

    const doItAsync = async () => {
      if (autocompleteSelector) {
        const autocompleteValues = await applySelectorArray(
          data,
          autocompleteSelector,
        );
        setAutocompleteOptions(autocompleteValues);
      }
    };

    doItAsync();
  }, [autocompleteSelector, data, props.id, value]);

  const handleChange = (
    _: React.SyntheticEvent,
    changed: AutocompleteValue<string[], false, false, false>,
  ) => {
    onChange(changed);
  };

  if (localError ?? error) {
    return <ErrorText text={localError ?? error ?? ''} id={id} />;
  }

  if (loading) {
    return <CircularProgress size={20} />;
  }

  if (autocompleteOptions) {
    return (
      <Box>
        <FormControl variant="outlined" fullWidth>
          <Autocomplete
            multiple
            data-testid={`${id}-autocomplete`}
            options={autocompleteOptions}
            isOptionEqualToValue={(option, selected) => option === selected}
            value={value}
            filterSelectedOptions
            onChange={handleChange}
            renderOption={(liProps, item) => {
              return (
                <li
                  {...liProps}
                  key={item}
                  data-testid={`${id}-autocomplete-option-${item}`}
                >
                  {item}
                </li>
              );
            }}
            renderInput={params => (
              <TextField
                {...params}
                data-testid={`${id}-text-field`}
                name={name}
                variant="outlined"
                label={label}
              />
            )}
            renderTags={(values, getTagProps) =>
              values.map((item, index) => (
                <Box key={item} title={item}>
                  <Chip
                    data-testid={`${id}-chip-${item}`}
                    variant="outlined"
                    label={item}
                    {...getTagProps({ index })}
                  />
                </Box>
              ))
            }
          />
        </FormControl>
      </Box>
    );
  }

  // Will not happen - either error or loading state will be rendered instead.
  return <></>;
};
