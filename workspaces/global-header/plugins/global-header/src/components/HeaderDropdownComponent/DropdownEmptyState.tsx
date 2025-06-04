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
import type { ReactNode, FC } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { InfoCard } from '@backstage/core-components';

/**
 * @public
 * Props for dropdown empty state
 */
interface DropdownEmptyStateProps {
  title: string;
  subTitle: string;
  icon: ReactNode;
}

export const DropdownEmptyState: FC<DropdownEmptyStateProps> = ({
  title,
  subTitle,
  icon,
}) => {
  return (
    <InfoCard>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          py: 4,
          px: 2, // Added padding to control width
          maxWidth: 300, // Set max width to constrain text expansion
          mx: 'auto',
        }}
      >
        {icon}
        <Typography variant="h6" sx={{ mt: 2, color: 'text.primary' }}>
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{ mt: 1, color: 'text.secondary', maxWidth: 250 }}
        >
          {subTitle}
        </Typography>
      </Box>
    </InfoCard>
  );
};
