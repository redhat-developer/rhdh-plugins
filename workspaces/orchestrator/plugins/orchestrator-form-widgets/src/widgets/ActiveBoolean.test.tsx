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
import { fireEvent, render, screen } from '@testing-library/react';
import { ActiveBoolean } from './ActiveBoolean';
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

describe('ActiveBoolean', () => {
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

  it('shows config error when fetch:url is provided without selectors', () => {
    render(
      <ActiveBoolean
        id="ab"
        name="ab"
        label="Active Boolean"
        required={false}
        readonly={false}
        disabled={false}
        autofocus={false}
        schema={{ type: 'boolean' }}
        uiSchema={{}}
        options={{ props: { 'fetch:url': 'https://example.test/api' } }}
        value={false}
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

    expect(screen.getByTestId('ab-error-text')).toHaveTextContent(
      'fetch:response:value or fetch:response:default',
    );
  });

  it('shows spinner while complete loading and no static default', () => {
    mockedUseProcessingState.mockReturnValue({
      completeLoading: true,
      wrapProcessing: async (fn: () => Promise<void>) => {
        await fn();
      },
    });

    const { container } = render(
      <ActiveBoolean
        id="ab"
        name="ab"
        label="Active Boolean"
        required={false}
        readonly={false}
        disabled={false}
        autofocus={false}
        schema={{ type: 'boolean' }}
        uiSchema={{}}
        options={{ props: {} }}
        value={false}
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

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('marks field as user-changed and forwards checkbox value', () => {
    const onChange = jest.fn();
    const setIsChangedByUser = jest.fn();

    render(
      <ActiveBoolean
        id="ab"
        name="ab"
        label="Active Boolean"
        required={false}
        readonly={false}
        disabled={false}
        autofocus={false}
        schema={{ type: 'boolean' }}
        uiSchema={{}}
        options={{ props: {} }}
        value={false}
        onChange={onChange}
        onBlur={() => {}}
        onFocus={() => {}}
        formContext={
          {
            formData: {},
            getIsChangedByUser: () => false,
            setIsChangedByUser,
          } as any
        }
        rawErrors={[]}
        registry={{} as any}
      />,
    );

    const checkbox = screen.getByTestId('ab-checkbox');
    expect(checkbox).toBeInTheDocument();

    fireEvent.click(checkbox);

    expect(setIsChangedByUser).toHaveBeenCalledWith('ab', true);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('renders unchecked checkbox for false value', () => {
    render(
      <ActiveBoolean
        id="ab"
        name="ab"
        label="Active Boolean"
        required={false}
        readonly={false}
        disabled={false}
        autofocus={false}
        schema={{ type: 'boolean' }}
        uiSchema={{}}
        options={{ props: {} }}
        value={false}
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

    const checkbox = screen
      .getByTestId('ab-checkbox')
      .querySelector('input') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it('renders checked checkbox for true value', () => {
    render(
      <ActiveBoolean
        id="ab"
        name="ab"
        label="Active Boolean"
        required={false}
        readonly={false}
        disabled={false}
        autofocus={false}
        schema={{ type: 'boolean' }}
        uiSchema={{}}
        options={{ props: {} }}
        value
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

    const checkbox = screen
      .getByTestId('ab-checkbox')
      .querySelector('input') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('disables checkbox when readonly is true', () => {
    render(
      <ActiveBoolean
        id="ab"
        name="ab"
        label="Active Boolean"
        required={false}
        readonly={false}
        disabled={false}
        autofocus={false}
        schema={{ type: 'boolean', readOnly: true }}
        uiSchema={{}}
        options={{ props: {} }}
        value={false}
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

    const checkbox = screen
      .getByTestId('ab-checkbox')
      .querySelector('input') as HTMLInputElement;
    expect(checkbox.disabled).toBe(true);
  });
});
