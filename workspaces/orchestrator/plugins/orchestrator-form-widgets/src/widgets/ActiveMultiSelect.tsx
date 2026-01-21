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
import {
  KeyboardEvent,
  SyntheticEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import clsx from 'clsx';
import { makeStyles } from 'tss-react/mui';
import { Theme } from '@mui/material/styles';
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
  useProcessingState,
} from '../utils';
import { UiProps } from '../uiPropTypes';
import { ErrorText } from './ErrorText';

const useStyles = makeStyles()(
  (theme: Theme & { rhdh?: { cardBorderColor: string } }) => ({
    chip: {
      // Workaround, we still have mix of Material 4 and 5 CSS in production, conflict with MuiButtonBase-root
      borderRadius: `16px !important` /* theme.shape.borderRadius is ugly 8px */,
      outline: `1px solid ${theme.rhdh?.cardBorderColor ?? '#A3A3A3'} !important`,
    },
  }),
);

export const ActiveMultiSelect: Widget<
  JsonObject,
  JSONSchema7,
  OrchestratorFormContextProps
> = props => {
  const { classes } = useStyles();
  const templateUnitEvaluator = useTemplateUnitEvaluator();
  const { id, name, label, value: rawValue, onChange, formContext } = props;
  const value = rawValue as string[];
  const formData = formContext?.formData;
  const isChangedByUser = !!formContext?.getIsChangedByUser(id);
  const setIsChangedByUser = formContext?.setIsChangedByUser;

  const uiProps = useMemo(
    () => (props.options.props ?? {}) as UiProps,
    [props.options.props],
  );
  const isReadOnly = !!props?.schema.readOnly;

  const autocompleteSelector =
    uiProps['fetch:response:autocomplete']?.toString();
  const mandatorySelector = uiProps['fetch:response:mandatory']?.toString();
  const defaultValueSelector = uiProps['fetch:response:value']?.toString();
  const allowNewItems = uiProps['ui:allowNewItems'] === true;
  const staticDefault = uiProps['fetch:response:default'];
  const staticDefaultValues = Array.isArray(staticDefault)
    ? (staticDefault as string[])
    : undefined;

  const [localError] = useState<string | undefined>(
    autocompleteSelector
      ? undefined
      : `Missing fetch:response:autocomplete selector for ${id}`,
  );
  const [inProgressItem, setInProgressItem] = useState<string>('');

  const [autocompleteOptions, setAutocompleteOptions] = useState<string[]>();
  const [mandatoryValues, setMandatoryValues] = useState<string[]>();

  // Compute all options: fetched options + in-progress item + static defaults as fallback
  const allOptions: string[] = useMemo(() => {
    const baseOptions = autocompleteOptions ?? [];
    const hasOptions = baseOptions.length > 0;

    // Start with fetched options or static defaults as fallback
    let options = hasOptions ? baseOptions : (staticDefaultValues ?? []);

    // Add in-progress item if allowed
    if (allowNewItems && inProgressItem.trim()) {
      options = [...new Set([inProgressItem.trim(), ...options])];
    }

    // Also include current values so they appear as options
    if (value && value.length > 0) {
      options = [...new Set([...options, ...value])];
    }

    return options;
  }, [
    inProgressItem,
    autocompleteOptions,
    allowNewItems,
    staticDefaultValues,
    value,
  ]);

  const handleFetchStarted = formContext?.handleFetchStarted;
  const handleFetchEnded = formContext?.handleFetchEnded;

  const retrigger = useRetriggerEvaluate(
    templateUnitEvaluator,
    formData,
    /* This is safe retype, since proper checking of input value is done in the useRetriggerEvaluate() hook */
    uiProps['fetch:retrigger'] as string[],
  );

  const { data, error, loading } = useFetch(formData ?? {}, uiProps, retrigger);

  // Track the complete loading state (fetch + processing)
  const { completeLoading, wrapProcessing } = useProcessingState(
    loading,
    handleFetchStarted,
    handleFetchEnded,
  );

  // Process fetch results
  // Note: Static defaults are applied at form initialization level (in OrchestratorForm)
  useEffect(() => {
    if (!data) {
      return;
    }

    const doItAsync = async () => {
      await wrapProcessing(async () => {
        if (autocompleteSelector) {
          const autocompleteValues = await applySelectorArray(
            data,
            autocompleteSelector,
            true,
            true,
          );

          // Only update if arrays differ (by item or count).
          const arraysAreEqual =
            Array.isArray(autocompleteOptions) &&
            autocompleteValues.length === autocompleteOptions.length &&
            [...autocompleteValues].sort().join(',') ===
              [...autocompleteOptions].sort().join(',');

          if (!arraysAreEqual) {
            setAutocompleteOptions(autocompleteValues);
          }
        }

        let defaults: string[] = [];
        if (!isChangedByUser) {
          // set this just once, when the user has not touched the field
          if (defaultValueSelector) {
            defaults = await applySelectorArray(
              data,
              defaultValueSelector,
              true,
              true,
            );
            // no need to persist the defaults, they are used only once
          }
        }

        let mandatory: string[] = [];
        if (mandatorySelector) {
          mandatory = await applySelectorArray(data, mandatorySelector, true);

          // Only update if arrays differ (by item or count).
          const arraysAreEqual =
            Array.isArray(mandatoryValues) &&
            mandatory.length === mandatoryValues.length &&
            [...mandatory].sort().join(',') ===
              [...mandatoryValues].sort().join(',');

          if (!arraysAreEqual) {
            setMandatoryValues(mandatory);
          }
        }

        if (
          !mandatory.every(item => value.includes(item)) ||
          !defaults.every(item => value.includes(item))
        ) {
          onChange([...new Set([...mandatory, ...value, ...defaults])]);
        }
      });
    };

    doItAsync();
  }, [
    autocompleteSelector,
    mandatorySelector,
    defaultValueSelector,
    autocompleteOptions,
    mandatoryValues,
    isChangedByUser,
    data,
    props.id,
    value,
    onChange,
    wrapProcessing,
  ]);

  const handleChange = (
    _: SyntheticEvent,
    changed: AutocompleteValue<string[], false, false, false>,
  ) => {
    if (setIsChangedByUser) {
      setIsChangedByUser(id, true);
    }
    setInProgressItem('');
    onChange(changed);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (allowNewItems && event.key === 'Enter' && inProgressItem.trim()) {
      event.preventDefault();
      event.stopPropagation();
      const newValue = inProgressItem.trim();
      if (!value.includes(newValue)) {
        if (setIsChangedByUser) {
          setIsChangedByUser(id, true);
        }
        onChange([...value, newValue]);
      }
      setInProgressItem('');
    }
  };

  const shouldShowFetchError = uiProps['fetch:error:silent'] !== true;
  const suppressFetchError = !shouldShowFetchError && !!error;
  const displayError = localError ?? (shouldShowFetchError ? error : undefined);
  if (displayError) {
    return <ErrorText text={displayError} id={id} />;
  }

  // Show spinner only if loading AND we don't have static defaults to show
  const hasStaticDefaults =
    staticDefaultValues && staticDefaultValues.length > 0;
  if (completeLoading && !hasStaticDefaults && !suppressFetchError) {
    return <CircularProgress size={20} />;
  }

  // Render if we have fetched options, static defaults, or current values
  const hasOptionsToShow =
    allOptions.length > 0 ||
    autocompleteOptions !== undefined ||
    suppressFetchError;
  if (hasOptionsToShow) {
    return (
      <Box>
        <FormControl variant="outlined" fullWidth>
          <Autocomplete
            multiple
            freeSolo={allowNewItems}
            data-testid={`${id}-autocomplete`}
            disabled={isReadOnly}
            options={allOptions}
            isOptionEqualToValue={(option, selected) => option === selected}
            value={value}
            inputValue={inProgressItem}
            onInputChange={(_, newInputValue, reason) => {
              // Only update input value for user input, not when selecting/clearing
              if (reason === 'input') {
                setInProgressItem(newInputValue);
              } else if (reason === 'clear') {
                setInProgressItem('');
              }
            }}
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
                onKeyDown={handleKeyDown}
              />
            )}
            renderTags={(values, getTagProps) =>
              values.map((item, index) => {
                const tagProps = getTagProps({ index });
                const {
                  className,
                  onDelete,
                  key: _,
                  ...restTagProps
                } = tagProps;

                return (
                  <Box key={item} title={item}>
                    <Chip
                      data-testid={`${id}-chip-${item}`}
                      variant="outlined"
                      label={item}
                      className={clsx(tagProps.className, classes.chip)}
                      onDelete={
                        mandatoryValues?.includes(item)
                          ? undefined /* mandatory - can not be deleted */
                          : onDelete
                      }
                      {...restTagProps}
                    />
                  </Box>
                );
              })
            }
          />
        </FormControl>
      </Box>
    );
  }

  // Will not happen - either error or loading state will be rendered instead.
  return <></>;
};
