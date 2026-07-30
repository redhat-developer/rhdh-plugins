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

import InfoOutlined from '@mui/icons-material/InfoOutlined';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { makeStyles } from 'tss-react/mui';

import { useIsDarkMode } from '../../utils/isDarkMode';

const useStyles = makeStyles<{ isDarkMode: boolean }>()(
  (theme, { isDarkMode }) => ({
    headerIcon: {
      color: isDarkMode ? theme.palette.grey[400] : theme.palette.grey[700],
    },
  }),
);

export const InfoCardTitleWithTooltip = ({
  title,
  tooltip,
}: {
  title: string;
  tooltip: string;
}) => {
  const isDarkMode = useIsDarkMode();
  const { classes } = useStyles({ isDarkMode });

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
      }}
    >
      <Typography
        component="span"
        variant="inherit"
        sx={{ fontWeight: 'bold' }}
      >
        {title}
      </Typography>
      <Tooltip title={tooltip}>
        <IconButton
          size="large"
          aria-label={tooltip}
          sx={{ mr: '8px', p: 0.5 }}
        >
          <InfoOutlined fontSize="small" className={classes.headerIcon} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
