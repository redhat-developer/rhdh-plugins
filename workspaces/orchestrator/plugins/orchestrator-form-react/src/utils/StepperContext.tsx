/*
 * Copyright 2024 The Backstage Authors
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
import React from 'react';

export type StepperContext = {
  activeStep: number;
  handleNext: () => void;
  handleBack: () => void;
  reviewStep: React.ReactNode;
  isValidating: boolean;
  handleValidateStarted: () => void;
  handleValidateEnded: () => void;
};

const context = React.createContext<StepperContext | null>(null);

export const useStepperContext = (): StepperContext => {
  const multiStepFormContext = React.useContext(context);
  if (!multiStepFormContext) {
    throw new Error('Context StepperContext is not defined');
  }
  return multiStepFormContext;
};

export const StepperContextProvider = ({
  children,
  reviewStep,
}: {
  children: React.ReactNode;
  reviewStep: React.ReactNode;
}) => {
  const [activeStep, setActiveStep] = React.useState<number>(0);
  const [isValidating, setIsValidating] = React.useState<boolean>(false);
  const contextData = React.useMemo(() => {
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
    };
  }, [setActiveStep, activeStep, reviewStep, isValidating, setIsValidating]);
  return <context.Provider value={contextData}>{children}</context.Provider>;
};
