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

import { ReactNode } from 'react';

import { act, renderHook } from '@testing-library/react';

import { StepperContextProvider, useStepperContext } from './StepperContext';

const wrapper =
  (reviewStep: ReactNode = <div>review</div>) =>
  ({ children }: { children: ReactNode }) => (
    <StepperContextProvider reviewStep={reviewStep} t={key => key}>
      {children}
    </StepperContextProvider>
  );

describe('StepperContext', () => {
  it('throws when used outside of the provider', () => {
    expect(() => renderHook(() => useStepperContext())).toThrow(
      'Context StepperContext is not defined',
    );
  });

  it('advances and goes back through steps', () => {
    const { result } = renderHook(() => useStepperContext(), {
      wrapper: wrapper(),
    });

    expect(result.current.activeStep).toBe(0);

    act(() => {
      result.current.handleNext();
    });
    expect(result.current.activeStep).toBe(1);

    act(() => {
      result.current.handleBack();
    });
    expect(result.current.activeStep).toBe(0);
  });

  it('only allows goToStep for previous steps', () => {
    const { result } = renderHook(() => useStepperContext(), {
      wrapper: wrapper(),
    });

    act(() => {
      result.current.handleNext();
      result.current.handleNext();
    });
    expect(result.current.activeStep).toBe(2);

    act(() => {
      result.current.goToStep(3);
    });
    expect(result.current.activeStep).toBe(2);

    act(() => {
      result.current.goToStep(0);
    });
    expect(result.current.activeStep).toBe(0);
  });

  it('tracks validating and fetching counters', () => {
    const { result } = renderHook(() => useStepperContext(), {
      wrapper: wrapper(),
    });

    act(() => {
      result.current.handleValidateStarted();
      result.current.handleFetchStarted();
      result.current.handleFetchStarted();
    });
    expect(result.current.isValidating).toBe(true);
    expect(result.current.isFetching).toBe(true);

    act(() => {
      result.current.handleFetchEnded();
    });
    expect(result.current.isFetching).toBe(true);

    act(() => {
      result.current.handleFetchEnded();
      result.current.handleValidateEnded();
    });
    expect(result.current.isFetching).toBe(false);
    expect(result.current.isValidating).toBe(false);
  });

  it('invokes clearFormErrorsRef when going back', () => {
    const clearFormErrors = jest.fn();
    const { result } = renderHook(() => useStepperContext(), {
      wrapper: wrapper(),
    });

    result.current.clearFormErrorsRef.current = clearFormErrors;

    act(() => {
      result.current.handleNext();
      result.current.handleBack();
    });

    expect(clearFormErrors).toHaveBeenCalled();
  });
});
