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

export const JsonCodeBlock = ({
  value,
  isDarkMode,
}: {
  value: object;
  isDarkMode: boolean;
}) => {
  const jsonString = JSON.stringify(value, null, 2);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await window.navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Paper
      elevation={1}
      sx={{
        position: 'relative',
        py: 2,
        bgcolor: isDarkMode ? '#151515' : '#F0F0F0',
        maxWidth: 600,
        marginTop: '10px',
      }}
    >
      <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
        <Tooltip title={copied ? 'Copied!' : 'Copy'}>
          <IconButton size="large" onClick={handleCopy}>
            <ContentCopyIcon
              fontSize="small"
              sx={{ color: isDarkMode ? '#B0B0B0' : '#4D4D4D' }}
            />
          </IconButton>
        </Tooltip>
      </Box>
      <Box
        component="pre"
        sx={{
          m: 1,
          fontFamily: 'Monospace',
          fontSize: '0.875rem',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          color: isDarkMode ? '#B0B0B0' : '#4D4D4D',
        }}
      >
        {jsonString}
      </Box>
    </Paper>
  );
};
