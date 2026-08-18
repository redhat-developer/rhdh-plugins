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
import { render, screen, waitFor } from '@testing-library/react';
import { SchemaUpdater } from './SchemaUpdater';
import * as utils from '../utils';

jest.mock('../utils', () => {
  const actual = jest.requireActual('../utils');
  return {
    ...actual,
    useTemplateUnitEvaluator: jest.fn(),
    useRetriggerEvaluate: jest.fn(),
    useFetch: jest.fn(),
    useProcessingState: jest.fn(),
    evaluateFetchResponseSelectorTemplate: jest.fn(),
    applySelectorObject: jest.fn(),
  };
});

const mockedUseTemplateUnitEvaluator =
  utils.useTemplateUnitEvaluator as jest.Mock;
const mockedUseRetriggerEvaluate = utils.useRetriggerEvaluate as jest.Mock;
const mockedUseFetch = utils.useFetch as jest.Mock;
const mockedUseProcessingState = utils.useProcessingState as jest.Mock;
const mockedEvaluateFetchResponseSelectorTemplate =
  utils.evaluateFetchResponseSelectorTemplate as jest.Mock;
const mockedApplySelectorObject = utils.applySelectorObject as jest.Mock;

describe('SchemaUpdater', () => {
  beforeEach(() => {
    mockedUseTemplateUnitEvaluator.mockReturnValue(() => undefined);
    mockedUseRetriggerEvaluate.mockReturnValue([]);
    mockedUseFetch.mockReturnValue({
      data: { nextStep: { type: 'string' } },
      error: undefined,
      loading: false,
    });
    mockedUseProcessingState.mockReturnValue({
      completeLoading: false,
      wrapProcessing: async (fn: () => Promise<void>) => {
        await fn();
      },
    });
    mockedEvaluateFetchResponseSelectorTemplate.mockResolvedValue(
      '$.next.schema.chunks',
    );
    mockedApplySelectorObject.mockResolvedValue({
      nextStep: { type: 'string' },
    });
  });

  it('shows error when updateSchema is missing from form context', async () => {
    render(
      <SchemaUpdater
        id="su"
        name="su"
        label="SchemaUpdater"
        required={false}
        readonly={false}
        disabled={false}
        autofocus={false}
        schema={{ type: 'string' }}
        uiSchema={{}}
        options={{ props: {} }}
        value={undefined}
        onChange={() => {}}
        onBlur={() => {}}
        onFocus={() => {}}
        formContext={{ formData: {} } as any}
        rawErrors={[]}
        registry={{} as any}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('su-error-text')).toHaveTextContent(
        'Missing the updateSchema() function',
      );
    });
  });

  it('applies selector result and calls updateSchema', async () => {
    const updateSchema = jest.fn();

    render(
      <SchemaUpdater
        id="su"
        name="su"
        label="SchemaUpdater"
        required={false}
        readonly={false}
        disabled={false}
        autofocus={false}
        schema={{ type: 'string' }}
        uiSchema={{}}
        options={{ props: { 'fetch:response:value': '$.foo' } }}
        value={undefined}
        onChange={() => {}}
        onBlur={() => {}}
        onFocus={() => {}}
        formContext={{ formData: {}, updateSchema } as any}
        rawErrors={[]}
        registry={{} as any}
      />,
    );

    await waitFor(() => {
      expect(mockedEvaluateFetchResponseSelectorTemplate).toHaveBeenCalled();
      expect(mockedApplySelectorObject).toHaveBeenCalled();
      expect(updateSchema).toHaveBeenCalledWith(
        { nextStep: { type: 'string' } },
        'su',
      );
    });
  });
});
