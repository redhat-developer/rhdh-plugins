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

import { type ReactElement, useState } from 'react';

import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';

/** @alpha */
export interface ScorecardLayoutItem {
  title: string;
  element: ReactElement;
}

const layoutIcons: Record<string, ReactElement> = {
  Grid: <ViewModuleIcon />,
  List: <ViewListIcon />,
};

export const ScorecardLayoutSwitcher = ({
  layouts,
}: {
  layouts: ScorecardLayoutItem[];
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (layouts.length === 0) return null;

  const selected = layouts[selectedIndex] ?? layouts[0];

  return (
    <Box>
      {layouts.length > 1 && (
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={selectedIndex}
            onChange={(_, value) => {
              if (value !== null) setSelectedIndex(value);
            }}
            sx={{
              '& .v5-MuiToggleButtonGroup-grouped': {
                border: 0,
                borderRadius: 1,
              },
            }}
          >
            {layouts.map((layout, i) => (
              <ToggleButton key={layout.title} value={i}>
                {layoutIcons[layout.title] ?? null}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      )}
      {selected.element}
    </Box>
  );
};
