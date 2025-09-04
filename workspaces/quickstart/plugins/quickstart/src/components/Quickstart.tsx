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

import Box from '@mui/material/Box';
import { QuickstartHeader } from './QuickstartHeader';
import Divider from '@mui/material/Divider';
import { QuickstartContent } from './QuickstartContent/QuickstartContent';
import { QuickstartFooter } from './QuickstartFooter';
import { useEffect, useState, useCallback } from 'react';
import { QuickstartItemData } from '../types';

type QuickstartProps = {
  quickstartItems: QuickstartItemData[];
  handleDrawerClose: () => void;
  isLoading: boolean;
};

export const Quickstart = ({
  quickstartItems,
  handleDrawerClose,
  isLoading,
}: QuickstartProps) => {
  const itemCount = quickstartItems.length;
  const [progress, setProgress] = useState<number>(0);

  const calculateProgress = useCallback(() => {
    const completedCount = quickstartItems.filter((item, index) => {
      const itemKey = `${item.title}-${index}`;
      const stepState = localStorage.getItem(itemKey);
      return stepState === 'true';
    }).length;

    const percentage = (completedCount / itemCount) * 100;
    return Math.round(percentage * 100) / 100;
  }, [quickstartItems, itemCount]);

  useEffect(() => {
    const calculatedProgress = calculateProgress();
    setProgress(calculatedProgress);
    localStorage.setItem('progressState', calculatedProgress.toString());
  }, [quickstartItems, itemCount, calculateProgress]);

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          flex: 1,
          padding: theme => theme.spacing(3),
          overflowY: 'auto',
        }}
      >
        <QuickstartHeader />
        <Divider />
        <QuickstartContent
          quickstartItems={quickstartItems}
          itemCount={itemCount}
          setProgress={() => {
            const newProgress = calculateProgress();
            setProgress(newProgress);
          }}
          isLoading={isLoading}
        />
      </Box>
      <QuickstartFooter
        handleDrawerClose={handleDrawerClose}
        progress={progress}
      />
    </Box>
  );
};
