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

import { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionPanel,
  AccordionTrigger,
  Box,
  Flex,
  Text,
} from '@backstage/ui';

import { QuickstartItemIcon } from './QuickstartItemIcon';
import { QuickstartCtaLink } from './QuickstartCtaLink';
import { QuickstartItemData } from '../../types';
import { useIsDarkTheme } from '../../hooks/useIsDarkTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { getTranslatedTextWithFallback } from '../../utils';

/**
 * Surfaces from theme / host PF tokens (no MUI useTheme, no PF package dep).
 * - incomplete: --bui-redhat-theme-bg-primary
 * - completed light: --pf-v5-global--palette--green-50
 * - completed dark:  --pf-t--global--text--color--status--success--clicked
 */
const itemBackground = (completed: boolean, isDark: boolean) => {
  if (!completed) {
    return 'var(--bui-redhat-theme-bg-primary)';
  }
  return isDark
    ? 'var(--pf-t--global--text--color--status--success--clicked, #223D2D)'
    : 'var(--pf-v5-global--palette--green-50, #F3FAF2)';
};

export type QuickstartItemProps = {
  item: QuickstartItemData;
  setProgress: () => void;
  index: number;
};

/** MUI ListItem + Collapse → BUI Accordion. */
export const QuickstartItem = ({
  item,
  setProgress,
  index,
}: QuickstartItemProps) => {
  const { t } = useTranslation();
  const isDark = useIsDarkTheme();
  const itemKey = `${item.title}-${index}`;
  const title = getTranslatedTextWithFallback(t, item.titleKey, item.title);

  const [stepCompleted, setStepCompleted] = useState(
    () => localStorage.getItem(itemKey) === 'true',
  );

  const markStepCompleted = () => {
    localStorage.setItem(itemKey, 'true');
    setStepCompleted(true);
    setProgress();
  };

  useEffect(() => {
    setStepCompleted(localStorage.getItem(itemKey) === 'true');
  }, [itemKey]);

  const itemStyle = {
    backgroundColor: itemBackground(stepCompleted, isDark),
  };

  return (
    <Accordion style={itemStyle}>
      <AccordionTrigger>
        <Flex gap="2" align="center">
          <QuickstartItemIcon icon={item.icon} />
          <Text variant="body-medium">{title}</Text>
        </Flex>
      </AccordionTrigger>
      <AccordionPanel style={itemStyle}>
        <Flex direction="column" align="start">
          <Text variant="body-medium">
            {getTranslatedTextWithFallback(
              t,
              item.descriptionKey,
              item.description,
            )}
          </Text>
          <Box mt="1">
            <QuickstartCtaLink cta={item.cta} onClick={markStepCompleted} />
          </Box>
        </Flex>
      </AccordionPanel>
    </Accordion>
  );
};
