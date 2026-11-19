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
  createContext,
  MutableRefObject,
  ReactNode,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

import { TranslationFunction } from '../hooks/useTranslation';
import { isBackwardStepNavigable, isStepNavigable } from './isStepNavigable';

export type StepperContext = {
  activeStep: number;
  furthestReachedStep: number;
  handleNext: () => void;
  handleBack: () => void;
  goToStep: (step: number) => void;
  requestGoToStep: (step: number) => void;
  clearFormErrorsRef: MutableRefObject<(() => void) | undefined>;
  pendingGoToStepRef: MutableRefObject<number | undefined>;
  requestFormSubmitRef: MutableRefObject<(() => void) | undefined>;
  completeGoToStep: (step: number, preserveErrors?: boolean) => void;
  reviewStep: ReactNode;
  isValidating: boolean;
  handleValidateStarted: () => void;
  handleValidateEnded: () => void;
  isFetching: boolean;
  handleFetchStarted: () => void;
  handleFetchEnded: () => void;
  t: TranslationFunction;
};

const context = createContext<StepperContext | null>(null);

export const useStepperContext = (): StepperContext => {
  const multiStepFormContext = useContext(context);
  if (!multiStepFormContext) {
    throw new Error('Context StepperContext is not defined');
  }
  return multiStepFormContext;
};

export const StepperContextProvider = ({
  children,
  reviewStep,
  t,
}: {
  children: ReactNode;
  reviewStep: ReactNode;
  t: TranslationFunction;
}) => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [furthestReachedStep, setFurthestReachedStep] = useState<number>(0);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [fetchingCount, setFetchingCount] = useState<number>(0);
  const clearFormErrorsRef = useRef<(() => void) | undefined>();
  const pendingGoToStepRef = useRef<number | undefined>();
  const requestFormSubmitRef = useRef<(() => void) | undefined>();

  const contextData = useMemo(() => {
    const clearFormErrors = () => clearFormErrorsRef.current?.();

    return {
      activeStep,
      furthestReachedStep,
      clearFormErrorsRef,
      pendingGoToStepRef,
      requestFormSubmitRef,
      handleNext: () => {
        setActiveStep(curActiveStep => {
          const nextStep = curActiveStep + 1;
          setFurthestReachedStep(currentFurthest =>
            Math.max(currentFurthest, nextStep),
          );
          return nextStep;
        });
      },
      handleBack: () => {
        clearFormErrors();
        setActiveStep(curActiveStep => curActiveStep - 1);
      },
      goToStep: (step: number) => {
        setActiveStep(curActiveStep => {
          if (!isBackwardStepNavigable(step, curActiveStep)) {
            return curActiveStep;
          }
          clearFormErrors();
          return step;
        });
      },
      completeGoToStep: (step: number, preserveErrors?: boolean) => {
        if (!preserveErrors) {
          clearFormErrors();
        }
        setActiveStep(step);
      },
      requestGoToStep: (step: number) => {
        if (!isStepNavigable(step, activeStep, furthestReachedStep)) {
          return;
        }
        if (isBackwardStepNavigable(step, activeStep)) {
          clearFormErrors();
          setActiveStep(step);
          return;
        }
        pendingGoToStepRef.current = step;
        requestFormSubmitRef.current?.();
      },
      reviewStep,
      isValidating,
      handleValidateStarted: () => setIsValidating(true),
      handleValidateEnded: () => setIsValidating(false),
      isFetching: fetchingCount > 0,
      handleFetchStarted: () => setFetchingCount(count => count + 1),
      handleFetchEnded: () => setFetchingCount(count => Math.max(0, count - 1)),
      t,
    };
  }, [
    t,
    activeStep,
    furthestReachedStep,
    reviewStep,
    isValidating,
    fetchingCount,
  ]);
  return <context.Provider value={contextData}>{children}</context.Provider>;
};
