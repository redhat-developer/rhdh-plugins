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

import { type ElementType, type ReactNode } from 'react';
import { Box, Typography } from '@material-ui/core';

export const PhaseField = ({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: ElementType;
  children: ReactNode;
}) => (
  <Box>
    <Box display="flex" alignItems="center" style={{ gap: 3, marginBottom: 2 }}>
      {Icon && (
        <Icon style={{ fontSize: '0.75rem', opacity: 0.6 }} color="action" />
      )}
      <Typography variant="caption" color="textSecondary">
        {label}
      </Typography>
    </Box>
    <Typography variant="body2" component="div">
      {children}
    </Typography>
  </Box>
);
