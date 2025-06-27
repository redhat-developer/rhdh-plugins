import Box from '@mui/material/Box';
import { QuickstartHeader } from './QuickstartHeader';
import Divider from '@mui/material/Divider';
import { QuickstartContent } from './QuickstartContent/QuickstartContent';
import { QuickstartFooter } from './QuickstartFooter';
import { useState } from 'react';

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
export const Quickstart = ({ quickstartItems, handleDrawerClose }: any) => {
  const itemCount = quickstartItems.length;
  const [completedItems, setCompletedItems] = useState<boolean[]>(
    new Array(itemCount).fill(false),
  );
  const [progress, setProgress] = useState<number>(0);

  const handleProgress = () => {
    const completedItemsCount = completedItems.filter(ci => ci).length;
    setProgress((completedItemsCount / itemCount) * 100);
  };

  return (
    <>
      <Box
        sx={{
          padding: theme =>
            `${theme.spacing(10.5)} ${theme.spacing(3)} ${theme.spacing(3)}`,
        }}
      >
        <QuickstartHeader />
        <Divider />
        <QuickstartContent
          quickstartItems={quickstartItems}
          setProgress={(index: number) => {
            setCompletedItems(ci => {
              ci.splice(index, 1, true);
              return ci;
            });
            handleProgress();
          }}
        />
      </Box>
      <QuickstartFooter
        handleDrawerClose={handleDrawerClose}
        progress={progress}
      />
    </>
  );
};
