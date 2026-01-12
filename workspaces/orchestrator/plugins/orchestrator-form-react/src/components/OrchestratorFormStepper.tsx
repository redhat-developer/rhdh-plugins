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

import Button from '@mui/material/Button';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Typography from '@mui/material/Typography';
import { makeStyles } from 'tss-react/mui';

import { useTranslation } from '../hooks/useTranslation';
import { useStepperContext } from '../utils/StepperContext';
import SubmitButton from './SubmitButton';

const useStyles = makeStyles()(theme => ({
  // Hotfix: this should be fixed in the theme
  step: {
    '.Mui-disabled': {
      backgroundColor: 'inherit !important',
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
  const { t } = useTranslation();
  const { classes } = useStyles();
  const { activeStep, reviewStep } = useStepperContext();
  const stepsWithReview = [
    ...steps,
    { content: reviewStep, title: t('common.review'), key: 'review' },
  ];

  return (
    <>
      <Stepper
        activeStep={activeStep}
        variant="elevation"
        style={{ overflowX: 'auto' }}
        alternativeLabel
      >
        {stepsWithReview?.map((step, index) => (
          <Step key={step.key} className={classes.step}>
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
      <div className={classes.formWrapper}>
        {stepsWithReview[activeStep].content}
      </div>
    </>
  );
};

export const OrchestratorFormToolbar = () => {
  const { t } = useTranslation();
  const { activeStep, handleBack, isValidating, isFetching } =
    useStepperContext();
  const { classes } = useStyles();

  return (
    <div className={classes.footer}>
      <Button
        disabled={activeStep === 0}
        onClick={handleBack}
        className={classes.regularButton}
      >
        {t('common.back')}
      </Button>
      <SubmitButton submitting={isValidating || isFetching}>
        {t('common.next')}
      </SubmitButton>
    </div>
  );
};

export default OrchestratorFormStepper;
