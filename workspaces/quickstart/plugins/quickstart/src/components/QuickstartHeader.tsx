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
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import quickstartImage from '../assets/quickstart-image.png';
import { useTranslation } from '../hooks/useTranslation';

export const QuickstartHeader = () => {
  const { t } = useTranslation();

  return (
    <Toolbar
      sx={{
        justifyContent: 'center',
        display: 'flex',
        flexFlow: 'column',
      }}
    >
      <img
        src={quickstartImage}
        alt=""
        width="128px"
        style={{ backgroundColor: '#f2f2f2' }}
      />
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          flexFlow: 'column',
          padding: theme => `${theme.spacing(3)} 0px`,
        }}
      >
        <Typography sx={{ fontSize: theme => theme.typography.h6 }}>
          {t('header.title')}
        </Typography>
        <Typography sx={{ fontSize: theme => theme.typography.caption }}>
          {t('header.subtitle')}
        </Typography>
      </Box>
    </Toolbar>
  );
};
