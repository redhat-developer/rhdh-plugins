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

import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

import { TranslationFunction } from '../hooks/useTranslation';

export type StepperContext = {
  activeStep: number;
  handleNext: () => void;
  handleBack: () => void;
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
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [fetchingCount, setFetchingCount] = useState<number>(0);

  const contextData = useMemo(() => {
    return {
      activeStep,
      handleNext: () => {
        setActiveStep(curActiveStep => curActiveStep + 1);
      },
      handleBack: () => setActiveStep(curActiveStep => curActiveStep - 1),
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
    setActiveStep,
    activeStep,
    reviewStep,
    isValidating,
    setIsValidating,
    fetchingCount,
    setFetchingCount,
  ]);
  return <context.Provider value={contextData}>{children}</context.Provider>;
};
