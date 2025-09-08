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
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiTooltip from '@mui/material/Tooltip';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import IconButton from '@mui/material/IconButton';
import { useTranslation } from '../../hooks/useTranslation';

const InfoComponent = () => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', mr: 2 }}>
      <MuiTooltip
        title={
          <Box sx={{ textAlign: 'center', width: '238px' }}>
            {t('users.tooltip')}
          </Box>
        }
        placement="left"
        componentsProps={{
          tooltip: {
            sx: {
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              bgcolor: '#151515',
              color: 'white',
              fontSize: '0.875rem',
              p: 1.5,
            },
          },
        }}
      >
        <IconButton>
          <InfoOutlinedIcon
            sx={{ color: theme.palette.text.secondary, fontSize: '1.75rem' }}
          />
        </IconButton>
      </MuiTooltip>
    </Box>
  );
};

export default InfoComponent;
