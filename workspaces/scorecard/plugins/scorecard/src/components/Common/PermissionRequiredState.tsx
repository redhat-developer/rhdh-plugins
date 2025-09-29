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
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { useTranslation } from '../../hooks/useTranslation';
import permissionRequiredSvg from '../../images/permission-required.svg';

const PermissionRequiredState = () => {
  const { t } = useTranslation();

  return (
    <Box sx={{ p: 4, height: '100%', maxWidth: '1592px', margin: 'auto' }}>
      <Grid
        container
        spacing={4}
        alignItems="center"
        justifyContent="center"
        height="100%"
      >
        <Grid item xs={12} md={6} sx={{ textAlign: 'left' }}>
          <Typography
            sx={theme => ({
              fontSize: '2.5rem',
              fontWeight: 400,
              color: theme.palette.text.primary,
              mb: 2,
            })}
          >
            {t('permissionRequired.title')}
          </Typography>

          <Typography
            sx={theme => ({
              fontSize: '1rem',
              color: theme.palette.text.secondary,
              mb: 3,
              lineHeight: 1.5,
            })}
          >
            {t('permissionRequired.description' as any, {
              permission: (
                <Typography
                  component="span"
                  sx={theme => ({
                    fontWeight: 'bold',
                    color: theme.palette.text.primary,
                  })}
                >
                  scorecard.metric.read
                </Typography>
              ),
            })}
          </Typography>

          <Button
            variant="outlined"
            target="_blank"
            href="https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/scorecard/plugins/scorecard/README.md#permission-framework-support"
            sx={theme => ({
              color: theme.palette.primary.main,
            })}
          >
            {t('permissionRequired.button')} &nbsp; <OpenInNewIcon />
          </Button>
        </Grid>

        <Grid item xs={12} md={6} sx={{ textAlign: 'right' }}>
          <Box
            component="img"
            src={permissionRequiredSvg}
            alt={t('permissionRequired.altText')}
            sx={{
              width: '100%',
              maxWidth: '600px',
              height: 'auto',
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default PermissionRequiredState;
