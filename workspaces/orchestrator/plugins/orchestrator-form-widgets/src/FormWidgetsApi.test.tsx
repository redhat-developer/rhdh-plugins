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
import { ComponentType } from 'react';
import { render } from '@testing-library/react';
import { FormWidgetsApi } from './FormWidgetsApi';
import * as utils from './utils';

jest.mock('./utils', () => {
  const actual = jest.requireActual('./utils');
  return {
    ...actual,
    useGetExtraErrors: jest.fn(),
  };
});

const mockedUseGetExtraErrors = utils.useGetExtraErrors as jest.Mock;

describe('FormWidgetsApi', () => {
  beforeEach(() => {
    mockedUseGetExtraErrors.mockReset();
    mockedUseGetExtraErrors.mockReturnValue(jest.fn());
  });

  it('returns undefined review component by default', () => {
    const api = new FormWidgetsApi();
    expect(api.getReviewComponent()).toBeUndefined();
  });

  it('decorates form component with widgets and context props', () => {
    const api = new FormWidgetsApi();
    const receivedProps: Record<string, unknown>[] = [];

    const DummyForm = (props: Record<string, unknown>) => {
      receivedProps.push(props);
      return <div data-testid="dummy-form" />;
    };

    const decorator = api.getFormDecorator();
    const Decorated = decorator(DummyForm as ComponentType<any>);

    render(
      <Decorated
        formData={{ current: { step: {} } }}
        getIsChangedByUser={() => false}
        setIsChangedByUser={() => {}}
      />,
    );

    expect(receivedProps).toHaveLength(1);
    expect(receivedProps[0].widgets).toEqual(
      expect.objectContaining({
        SchemaUpdater: expect.any(Function),
        ActiveTextInput: expect.any(Function),
        ActiveText: expect.any(Function),
        ActiveDropdown: expect.any(Function),
        ActiveMultiSelect: expect.any(Function),
      }),
    );
    expect(receivedProps[0].customValidate).toEqual(expect.any(Function));
    expect(receivedProps[0].getExtraErrors).toEqual(expect.any(Function));
    expect(receivedProps[0].formContext).toEqual(
      expect.objectContaining({
        formData: expect.any(Object),
        getIsChangedByUser: expect.any(Function),
        setIsChangedByUser: expect.any(Function),
      }),
    );
  });
});
