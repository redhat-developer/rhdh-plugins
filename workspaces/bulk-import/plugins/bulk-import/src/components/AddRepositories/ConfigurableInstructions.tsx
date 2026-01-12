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

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { useInstructionsConfig, useInstructionsPreference } from '../../hooks';
import { useTranslation } from '../../hooks/useTranslation';
import { InstructionIcon } from './InstructionIcon';

/**
 * Configurable instructions component that displays the "How does it work" section
 * based on configuration from app-config.yaml and user preferences
 */
export const ConfigurableInstructions = () => {
  const theme = useTheme();
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
        expanded={isExpanded}
        onChange={(_, expanded) => setExpanded(expanded)}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          id="add-repository-summary"
        >
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            {title}
          </Typography>
        </AccordionSummary>
        <AccordionDetails
          sx={{
            padding: 0,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              overflowX: 'auto',
              overflowY: 'hidden',
              padding: '16px',
              gap: '24px',
              minHeight: '180px',
              // Custom scrollbar styling - theme-aware colors
              '&::-webkit-scrollbar': {
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: theme.palette.action.hover,
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: theme.palette.action.disabled,
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: theme.palette.action.selected,
                },
              },
            }}
          >
            {steps.map(step => (
              <Box
                key={step.id}
                sx={{
                  flexShrink: 0,
                  minWidth: '150px',
                  // Dynamic width: if few steps, expand to fill space; if many steps, use fixed width
                  flex: steps.length <= 6 ? '1 1 0' : '0 0 200px',
                  maxWidth: steps.length <= 6 ? 'none' : '200px',
                  // Ensure consistent vertical alignment
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                }}
              >
                <InstructionIcon icon={step.icon} text={step.text} />
              </Box>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>
    </div>
  );
};
