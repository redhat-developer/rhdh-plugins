/*
 * Copyright 2024 The Backstage Authors
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

import React from 'react';
import Typography from '@mui/material/Typography';
import { SvgIconProps } from '@mui/material/SvgIcon';
import Box from '@mui/material/Box';
import SmallIconWrapper from '../HeaderIconButton/SmallIconWrapper';

const MenuItemContent: React.FC<{
  Icon?: React.ElementType<SvgIconProps>;
  label: string;
  subLabel?: string;
}> = ({ Icon, label, subLabel }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', margin: '8px 0' }}>
    {Icon && (
      <SmallIconWrapper
        IconComponent={Icon}
        sx={{ marginRight: '0.5rem', flexShrink: 0 }}
      />
    )}
    <Box>
      <Typography variant="body2">{label}</Typography>
      {subLabel && (
        <Typography variant="caption" color="text.secondary">
          {subLabel}
        </Typography>
      )}
    </Box>
  </Box>
);

export default MenuItemContent;
