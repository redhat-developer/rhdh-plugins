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
import { ActiveText } from './ActiveText';
import * as utils from '../utils';

jest.mock('../utils', () => {
  const actual = jest.requireActual('../utils');
  return {
    ...actual,
    useFetchAndEvaluate: jest.fn(),
  };
});

const mockedUseFetchAndEvaluate = utils.useFetchAndEvaluate as jest.Mock;

describe('ActiveText', () => {
  beforeEach(() => {
    mockedUseFetchAndEvaluate.mockReturnValue({
      text: 'resolved markdown',
      error: undefined,
      fetchError: undefined,
      loading: false,
      waitingForRetrigger: false,
    });
  });

  it('renders configuration error when ui:text is missing', () => {
    render(
      <ActiveText
        id="at"
        name="at"
        label="AT"
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

    expect(screen.getByTestId('at-error-text')).toHaveTextContent(
      "doesn't contain property ui:text",
    );
  });

  it('renders fetch/evaluation error', () => {
    mockedUseFetchAndEvaluate.mockReturnValue({
      text: '',
      error: 'template error',
      fetchError: undefined,
      loading: false,
      waitingForRetrigger: false,
    });

    render(
      <ActiveText
        id="at"
        name="at"
        label="AT"
        required={false}
        readonly={false}
        disabled={false}
        autofocus={false}
        schema={{ type: 'string' }}
        uiSchema={{}}
        options={{ props: { 'ui:text': 'hello' } }}
        value={undefined}
        onChange={() => {}}
        onBlur={() => {}}
        onFocus={() => {}}
        formContext={{ formData: {} } as any}
        rawErrors={[]}
        registry={{} as any}
      />,
    );

    expect(screen.getByTestId('at-error-text')).toHaveTextContent(
      'template error',
    );
  });

  it('renders evaluated markdown content', () => {
    render(
      <ActiveText
        id="at"
        name="at"
        label="AT"
        required={false}
        readonly={false}
        disabled={false}
        autofocus={false}
        schema={{ type: 'string' }}
        uiSchema={{}}
        options={{ props: { 'ui:text': 'hello' } }}
        value={undefined}
        onChange={() => {}}
        onBlur={() => {}}
        onFocus={() => {}}
        formContext={{ formData: {} } as any}
        rawErrors={[]}
        registry={{} as any}
      />,
    );

    expect(screen.getByTestId('at')).toHaveTextContent('resolved markdown');
  });
});
