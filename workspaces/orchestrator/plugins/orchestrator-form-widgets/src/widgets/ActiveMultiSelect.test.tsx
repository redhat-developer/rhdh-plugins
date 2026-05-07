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
import { render, screen, waitFor } from '@testing-library/react';
import { OrchestratorFormContextProps } from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-api';
import { ActiveMultiSelect } from './ActiveMultiSelect';
import * as utils from '../utils';

jest.mock('../utils', () => {
  const actual = jest.requireActual('../utils');
  return {
    ...actual,
    useTemplateUnitEvaluator: jest.fn(),
    useRetriggerEvaluate: jest.fn(),
    useFetch: jest.fn(),
    useProcessingState: jest.fn(),
  };
});

const mockedUseTemplateUnitEvaluator =
  utils.useTemplateUnitEvaluator as jest.Mock;
const mockedUseRetriggerEvaluate = utils.useRetriggerEvaluate as jest.Mock;
const mockedUseFetch = utils.useFetch as jest.Mock;
const mockedUseProcessingState = utils.useProcessingState as jest.Mock;

type HarnessProps = {
  initialValue?: string[];
};

const WidgetHarness = ({ initialValue = [] }: HarnessProps) => {
  const [value, setValue] = useState<string[]>(initialValue);

  return (
    <ActiveMultiSelect
      id="contacts"
      name="contacts"
      label="Contacts"
      required={false}
      readonly={false}
      disabled={false}
      autofocus={false}
      schema={{ type: 'array', items: { type: 'string' } }}
      uiSchema={{}}
      options={{
        props: {
          'fetch:response:autocomplete': '$.contacts ? $.contacts : []',
          'fetch:response:value': '$.contacts ? $.contacts : []',
          'fetch:retrigger': ['current.step.xParams.selectedEnvironment'],
          'fetch:clearOnRetrigger': true,
        },
      }}
      value={value}
      onChange={changed => setValue(changed as string[])}
      onBlur={() => {}}
      onFocus={() => {}}
      formContext={
        {
          formData: {
            current: {
              step: {
                xParams: {},
              },
            },
          },
          getIsChangedByUser: () => false,
          setIsChangedByUser: () => {},
        } as unknown as OrchestratorFormContextProps
      }
      rawErrors={[]}
      registry={{} as any}
    />
  );
};

describe('ActiveMultiSelect', () => {
  beforeEach(() => {
    mockedUseTemplateUnitEvaluator.mockReturnValue(() => undefined);
    mockedUseProcessingState.mockReturnValue({
      completeLoading: false,
      wrapProcessing: async (fn: () => Promise<void>) => {
        await fn();
      },
    });
  });

  it('replaces values on retrigger when clearOnRetrigger is enabled', async () => {
    let retrigger = ['sandbox'];
    let responseData = { contacts: ['Alice', 'Bob', 'Charlie'] };

    mockedUseRetriggerEvaluate.mockImplementation(() => retrigger);
    mockedUseFetch.mockImplementation(() => ({
      data: responseData,
      error: undefined,
      loading: false,
    }));

    const { rerender } = render(<WidgetHarness />);

    await waitFor(() => {
      expect(screen.getByTestId('contacts-chip-Alice')).toBeInTheDocument();
      expect(screen.getByTestId('contacts-chip-Bob')).toBeInTheDocument();
      expect(screen.getByTestId('contacts-chip-Charlie')).toBeInTheDocument();
    });

    retrigger = ['prod'];
    responseData = { contacts: ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve'] };
    rerender(<WidgetHarness />);

    await waitFor(() => {
      expect(screen.getByTestId('contacts-chip-Dave')).toBeInTheDocument();
      expect(screen.getByTestId('contacts-chip-Eve')).toBeInTheDocument();
    });

    retrigger = ['sandbox'];
    responseData = { contacts: ['Alice', 'Bob', 'Charlie'] };
    rerender(<WidgetHarness />);

    await waitFor(() => {
      expect(screen.getByTestId('contacts-chip-Alice')).toBeInTheDocument();
      expect(screen.getByTestId('contacts-chip-Bob')).toBeInTheDocument();
      expect(screen.getByTestId('contacts-chip-Charlie')).toBeInTheDocument();
      expect(
        screen.queryByTestId('contacts-chip-Dave'),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId('contacts-chip-Eve')).not.toBeInTheDocument();
    });
  });

  it('replaces stale initial values when clearOnRetrigger is enabled', async () => {
    const retrigger = ['sandbox'];
    const responseData = { contacts: ['Alice', 'Bob', 'Charlie'] };

    mockedUseRetriggerEvaluate.mockImplementation(() => retrigger);
    mockedUseFetch.mockImplementation(() => ({
      data: responseData,
      error: undefined,
      loading: false,
    }));

    render(
      <WidgetHarness
        initialValue={['Alice', 'Bob', 'Charlie', 'Dave', 'Eve']}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('contacts-chip-Alice')).toBeInTheDocument();
      expect(screen.getByTestId('contacts-chip-Bob')).toBeInTheDocument();
      expect(screen.getByTestId('contacts-chip-Charlie')).toBeInTheDocument();
      expect(
        screen.queryByTestId('contacts-chip-Dave'),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId('contacts-chip-Eve')).not.toBeInTheDocument();
    });
  });
});
