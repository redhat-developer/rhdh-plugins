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
import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { OrchestratorFormContextProps } from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-api';
import { ActiveTextInput } from './ActiveTextInput';
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

type HarnessProps = { initialValue?: string };

const WidgetHarness = ({ initialValue = '' }: HarnessProps) => {
  const [value, setValue] = useState(initialValue);

  return (
    <ActiveTextInput
      id="ati"
      name="ati"
      label="ATI"
      required={false}
      readonly={false}
      disabled={false}
      autofocus={false}
      schema={{ type: 'string' }}
      uiSchema={{}}
      options={{
        props: {
          'fetch:response:value': 'observers',
          'fetch:retrigger': ['current.step.xParams.platformProfileID'],
          'fetch:clearOnRetrigger': true,
        },
      }}
      value={value}
      onChange={changed => setValue(changed as string)}
      onBlur={() => {}}
      onFocus={() => {}}
      formContext={
        {
          formData: { current: { step: { xParams: {} } } },
          getIsChangedByUser: () => false,
          setIsChangedByUser: () => {},
        } as unknown as OrchestratorFormContextProps
      }
      rawErrors={[]}
      registry={{} as any}
    />
  );
};

describe('ActiveTextInput', () => {
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
      <ActiveTextInput
        id="ati"
        name="ati"
        label="ATI"
        required={false}
        readonly={false}
        disabled={false}
        autofocus={false}
        schema={{ type: 'string' }}
        uiSchema={{}}
        options={{ props: { 'fetch:url': 'https://example.test/api' } }}
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

    expect(screen.getByTestId('ati-error-text')).toHaveTextContent(
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
      <ActiveTextInput
        id="ati"
        name="ati"
        label="ATI"
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

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('marks field as user-changed and forwards text input value', () => {
    const onChange = jest.fn();
    const setIsChangedByUser = jest.fn();

    render(
      <ActiveTextInput
        id="ati"
        name="ati"
        label="ATI"
        required={false}
        readonly={false}
        disabled={false}
        autofocus={false}
        schema={{ type: 'string' }}
        uiSchema={{}}
        options={{ props: {} }}
        value=""
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

    const input = screen.getByTestId('ati-textfield').querySelector('input');
    expect(input).toBeInTheDocument();

    fireEvent.change(input!, {
      target: { value: 'new value' },
    });

    expect(setIsChangedByUser).toHaveBeenCalledWith('ati', true);
    expect(onChange).toHaveBeenCalledWith('new value');
  });

  it('clears stale initial value when fetch returns an empty string', async () => {
    mockedUseRetriggerEvaluate.mockImplementation(() => ['67890']);
    mockedUseFetch.mockImplementation(() => ({
      data: { observers: '' },
      error: undefined,
      loading: false,
    }));

    render(<WidgetHarness initialValue="group-A" />);

    await waitFor(() => {
      const input = screen.getByTestId('ati-textfield').querySelector('input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('');
    });
  });
});
