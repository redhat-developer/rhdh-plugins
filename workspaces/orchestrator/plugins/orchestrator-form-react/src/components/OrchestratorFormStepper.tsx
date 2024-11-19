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

import {
  Button,
  makeStyles,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@material-ui/core';

import { useStepperContext } from '../utils/StepperContext';
import SubmitButton from './SubmitButton';

const useStyles = makeStyles(theme => ({
  // Hotfix: this should be fixed in the theme
  step: {
    '& form': {
      '& .field-array > div > div': {
        outline: 'inherit !important',
        padding: 'inherit !important',
        backgroundColor: 'inherit !important',

        '& div > div > div > div': {
          // unfortunately there are no better CSS selectors
          backgroundColor: 'inherit !important',
        },
      },
    },
  },
  regularButton: {
    // hotifx for https://issues.redhat.com/browse/FLPATH-1825
    backgroundColor: 'inherit !important',
  },
  footer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'right',
    marginTop: theme.spacing(2),
  },
  formWrapper: {
    padding: theme.spacing(2),
  },
}));

export type OrchestratorFormStep = {
  content: React.ReactNode;
  title: string;
  key: string;
};

const OrchestratorFormStepper = ({
  steps,
}: {
  steps: OrchestratorFormStep[];
}) => {
  const { activeStep, reviewStep } = useStepperContext();
  const stepsWithReview = [
    ...steps,
    { content: reviewStep, title: 'Review', key: 'review' },
  ];
  const styles = useStyles();
  return (
    <>
      <Stepper
        activeStep={activeStep}
        variant="elevation"
        style={{ overflowX: 'auto' }}
        alternativeLabel
      >
        {stepsWithReview?.map((step, index) => (
          <Step key={step.key} className={styles.step}>
            <StepLabel
              aria-label={`Step ${index + 1} ${step.title}`}
              aria-disabled="false"
              tabIndex={0}
            >
              <Typography variant="h6" component="h2">
                {step.title}
              </Typography>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
      <div className={styles.formWrapper}>
        {stepsWithReview[activeStep].content}
      </div>
    </>
  );
};

export const OrchestratorFormToolbar = () => {
  const { activeStep, handleBack, isValidating } = useStepperContext();
  const styles = useStyles();
  return (
    <div className={styles.footer}>
      <Button
        disabled={activeStep === 0}
        onClick={handleBack}
        className={styles.regularButton}
      >
        Back
      </Button>
      <SubmitButton submitting={isValidating}>Next</SubmitButton>
    </div>
  );
};

export default OrchestratorFormStepper;
