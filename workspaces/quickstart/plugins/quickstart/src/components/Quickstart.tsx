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

import { useEffect, useState, useCallback } from 'react';
import { Box, Flex } from '@backstage/ui';

import { QuickstartHeader } from './QuickstartHeader';
import { QuickstartContent } from './QuickstartContent/QuickstartContent';
import { QuickstartFooter } from './QuickstartFooter';
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
    if (itemCount === 0) {
      return 0;
    }

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
    <Flex
      direction="column"
      style={{
        height: '100%',
        // Theme token: #F2F2F2 light / #151515 dark (sidebar / page-inset chrome)
        backgroundColor: 'var(--bui-redhat-theme-page-inset-bg)',
      }}
    >
      <Box
        grow
        p="6"
        tabIndex={0}
        style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}
      >
        <QuickstartHeader />
        <hr
          style={{
            border: 'none',
            borderTop: '1px solid var(--bui-border-1)',
            margin: 0,
          }}
        />
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
    </Flex>
  );
};
