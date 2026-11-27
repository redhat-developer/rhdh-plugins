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

import { useMemo } from 'react';

import {
  Accordion,
  AccordionPanel,
  AccordionTrigger,
  Box,
  Flex,
} from '@backstage/ui';

import { useInstructionsConfig, useInstructionsPreference } from '../../hooks';
import { useTranslation } from '../../hooks/useTranslation';
import { InstructionIcon } from './InstructionIcon';

/**
 * Configurable instructions component that displays the "How does it work" section
 * based on configuration from app-config.yaml and user preferences
 */
export const ConfigurableInstructions = () => {
  const { t } = useTranslation();
  const config = useInstructionsConfig();
  const [isExpanded, setExpanded] = useInstructionsPreference(
    config.defaultExpanded,
  );

  // Build the list of steps based on configuration from app-config.yaml
  const steps = useMemo(() => {
    return config.steps.map(configStep => ({
      id: configStep.id,
      text: configStep.text,
      icon: configStep.icon,
    }));
  }, [config.steps]);

  // Don't render if disabled or no steps configured
  if (!config.enabled || steps.length === 0) {
    return null;
  }

  const title = t('page.importEntitiesSubtitle');

  return (
    <div style={{ padding: '24px' }}>
      <Accordion
        id="add-repository-instructions"
        isExpanded={isExpanded}
        onExpandedChange={setExpanded}
      >
        <AccordionTrigger id="add-repository-summary" title={title} />
        <AccordionPanel>
          <Flex
            direction="row"
            gap="6"
            style={{
              overflowX: 'auto',
              overflowY: 'hidden',
              padding: '16px',
              minHeight: '180px',
            }}
          >
            {steps.map(step => (
              <Box
                key={step.id}
                style={{
                  flexShrink: 0,
                  minWidth: '150px',
                  flex: steps.length <= 6 ? '1 1 0' : '0 0 200px',
                  maxWidth: steps.length <= 6 ? 'none' : '200px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                }}
              >
                <InstructionIcon icon={step.icon} text={step.text} />
              </Box>
            ))}
          </Flex>
        </AccordionPanel>
      </Accordion>
    </div>
  );
};
