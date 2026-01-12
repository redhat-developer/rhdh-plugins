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
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { useTranslation } from '../hooks/useTranslation';

export type QuickstartFooterProps = {
  handleDrawerClose: () => void;
  progress: number;
};

export const QuickstartFooter = ({
  handleDrawerClose,
  progress,
}: QuickstartFooterProps) => {
  const { t } = useTranslation();

  return (
    <Box>
      <LinearProgress variant="determinate" value={progress} />
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: theme => `${theme.spacing(2.5)}`,
        }}
      >
        <Typography sx={{ fontSize: theme => theme.typography.caption }}>
          {progress > 0
            ? t('footer.progress' as any, { progress: progress.toString() })
            : t('footer.notStarted')}
        </Typography>
        <Button onClick={() => handleDrawerClose()}>{t('footer.hide')}</Button>
      </Box>
    </Box>
  );
};
