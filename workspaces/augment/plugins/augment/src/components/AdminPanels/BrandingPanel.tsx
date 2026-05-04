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
import Typography from '@mui/material/Typography';
import { Progress } from '@backstage/core-components';
import { useEffectiveConfig } from '../../hooks';
import { AppearanceSection } from './AppearanceSection';

export const BrandingPanel = () => {
  const { config: effectiveConfig, loading: ecLoading } = useEffectiveConfig();

  if (ecLoading) {
    return <Progress />;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ px: 3, pt: 2, maxWidth: 960 }}>
        <Typography variant="h5" sx={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.01em', color: 'text.primary' }} gutterBottom>
          Branding
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Customize the chat interface identity and colors.
        </Typography>
      </Box>

      <Box sx={{ px: 3, py: 1, maxWidth: 960 }}>
        <AppearanceSection effectiveConfig={effectiveConfig} />
      </Box>
    </Box>
  );
};
