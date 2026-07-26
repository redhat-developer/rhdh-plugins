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
import { render, screen } from '@testing-library/react';
import { ActiveDropdown } from './ActiveDropdown';
import * as utils from '../utils';

jest.mock('../utils', () => {
  const actual = jest.requireActual('../utils');
  return {
    ...actual,
    useTemplateUnitEvaluator: jest.fn(),
    useRetriggerEvaluate: jest.fn(),
    useFetch: jest.fn(),
    useProcessingState: jest.fn(),
    useClearOnRetrigger: jest.fn(),
  };
});

const mockedUseTemplateUnitEvaluator =
  utils.useTemplateUnitEvaluator as jest.Mock;
const mockedUseRetriggerEvaluate = utils.useRetriggerEvaluate as jest.Mock;
const mockedUseFetch = utils.useFetch as jest.Mock;
const mockedUseProcessingState = utils.useProcessingState as jest.Mock;

describe('ActiveDropdown', () => {
  beforeEach(() => {
    mockedUseTemplateUnitEvaluator.mockReturnValue(() => undefined);
    mockedUseRetriggerEvaluate.mockReturnValue([]);
    mockedUseFetch.mockReturnValue({
      data: undefined,
      error: undefined,
      loading: false,
    });
    mockedUseProcessingState.mockReturnValue({
      completeLoading: false,
      wrapProcessing: async (fn: () => Promise<void>) => {
        await fn();
      },
    });
  });

  it('shows error when required selectors are missing', () => {
    render(
      <ActiveDropdown
        id="ad"
        name="ad"
        label="Dropdown"
        required={false}
        readonly={false}
        disabled={false}
        autofocus={false}
        schema={{ type: 'string' }}
        uiSchema={{}}
        options={{ props: {} }}
        value=""
        onChange={() => {}}
        onBlur={() => {}}
        onFocus={() => {}}
        formContext={
          {
            formData: {},
            getIsChangedByUser: () => false,
            setIsChangedByUser: () => {},
          } as any
        }
        rawErrors={[]}
        registry={{} as any}
      />,
    );

    expect(screen.getByTestId('ad-error-text')).toHaveTextContent(
      'fetch:response:label and fetch:response:value',
    );
  });

  it('suppresses fetch errors and renders disabled select fallback', () => {
    mockedUseFetch.mockReturnValue({
      data: undefined,
      error: 'network failed',
      loading: false,
    });

    render(
      <ActiveDropdown
        id="ad"
        name="ad"
        label="Dropdown"
        required={false}
        readonly={false}
        disabled={false}
        autofocus={false}
        schema={{ type: 'string' }}
        uiSchema={{}}
        options={{
          props: {
            'fetch:response:label': '$.labels',
            'fetch:response:value': '$.values',
            'fetch:error:silent': true,
          },
        }}
        value=""
        onChange={() => {}}
        onBlur={() => {}}
        onFocus={() => {}}
        formContext={
          {
            formData: {},
            getIsChangedByUser: () => false,
            setIsChangedByUser: () => {},
          } as any
        }
        rawErrors={[]}
        registry={{} as any}
      />,
    );

    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.queryByTestId('ad-error-text')).not.toBeInTheDocument();
  });
});
