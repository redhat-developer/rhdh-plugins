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
import List from '@mui/material/List';
import CircularProgress from '@mui/material/CircularProgress';
import { QuickstartItem } from './QuickstartItem';
import { useState, useEffect } from 'react';
import { QuickstartItemData } from '../../types';

type QuickstartContentProps = {
  quickstartItems: QuickstartItemData[];
  setProgress: (index: number) => void;
  itemCount: number;
  isLoading: boolean;
};

export const QuickstartContent = ({
  quickstartItems,
  setProgress,
  itemCount,
  isLoading,
}: QuickstartContentProps) => {
  const [openItems, setOpenItems] = useState<boolean[]>(
    new Array(itemCount).fill(false),
  );

  // Re-initialize openItems when itemCount changes (e.g., after loading)
  useEffect(() => {
    setOpenItems(new Array(itemCount).fill(false));
  }, [itemCount]);

  // Show loading spinner when user role is still being determined
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          width: '100%',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        paddingTop: theme => `${theme.spacing(3)}`,
      }}
    >
      <List disablePadding>
        {quickstartItems.map((item: QuickstartItemData, index: number) => (
          <QuickstartItem
            key={`${item.title}-${index}`}
            item={item}
            index={index}
            open={openItems[index]}
            handleOpen={() =>
              setOpenItems(oi => {
                return oi.map((val, valIndex) =>
                  valIndex === index ? !val : false,
                );
              })
            }
            setProgress={() => setProgress(index)}
          />
        ))}
      </List>
    </Box>
  );
};
