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
import { Content, Header, InfoCard, Page } from '@backstage/core-components';
import { Grid, Step, StepLabel, Stepper } from '@material-ui/core';
import { useState } from 'react';
import { WizardActions } from './WizardActions';

export const NewProjectPage = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      // TODO: review the titles
      title: 'Job name and description',
      content: <div>Job name and description</div>,
    },
    {
      title: 'Source and target repositories',
      content: <div>Source and target repositories</div>,
    },
    {
      title: 'Review and start',
      content: <div>Last step</div>,
    },
  ];

  return (
    <Page themeId="tool">
      <Header
        title="New conversion"
        subtitle="Migration Hub / New conversion project"
      />

      <Content>
        <Grid container spacing={3} direction="column">
          <Grid item>
            <InfoCard
              title={
                <Stepper
                  activeStep={activeStep}
                  variant="elevation"
                  style={{ overflowX: 'auto', padding: 0 }}
                >
                  {steps.map(step => (
                    <Step key={step.title}>
                      <StepLabel aria-disabled="false" tabIndex={0}>
                        {step.title}
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              }
              actions={
                <WizardActions
                  canNext={activeStep < steps.length - 1}
                  canBack={activeStep > 0}
                  onCancelLink="/x2a"
                  onBack={() => setActiveStep(activeStep - 1)}
                  onNext={() => setActiveStep(activeStep + 1)}
                />
              }
            >
              {steps[activeStep].content}
            </InfoCard>
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};
