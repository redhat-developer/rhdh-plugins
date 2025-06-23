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

import React from 'react';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import { makeStyles } from 'tss-react/mui';

const useStyles = makeStyles<{ isDarkMode: boolean }>()(
  (theme, { isDarkMode }) => ({
    root: {
      position: 'relative',
      paddingTop: theme.spacing(2),
      paddingBottom: theme.spacing(2),
      backgroundColor: isDarkMode ? '#151515' : '#F0F0F0',
      maxWidth: 600,
      marginTop: '0.6rem',
    },
    iconButton: {
      position: 'absolute',
      top: 8,
      right: 8,
    },
    copyIcon: {
      color: isDarkMode ? '#B0B0B0' : '#4D4D4D',
    },
    pre: {
      margin: theme.spacing(1),
      fontFamily: 'Monospace',
      fontSize: '0.875rem',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      color: isDarkMode ? '#B0B0B0' : '#4D4D4D',
    },
  }),
);

export const JsonCodeBlock = ({
  value,
  isDarkMode,
}: {
  value: object;
  isDarkMode: boolean;
}) => {
  const jsonString = JSON.stringify(value, null, 2);
  const [copied, setCopied] = React.useState(false);
  const { classes } = useStyles({ isDarkMode });

  const handleCopy = async () => {
    await window.navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Paper elevation={1} className={classes.root}>
      <Box className={classes.iconButton}>
        <Tooltip title={copied ? 'Copied!' : 'Copy'}>
          <IconButton size="large" onClick={handleCopy}>
            <ContentCopyIcon fontSize="small" className={classes.copyIcon} />
          </IconButton>
        </Tooltip>
      </Box>
      <Box component="pre" className={classes.pre}>
        {jsonString}
      </Box>
    </Paper>
  );
};
