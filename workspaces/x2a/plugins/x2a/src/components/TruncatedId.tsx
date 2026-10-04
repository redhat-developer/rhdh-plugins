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

import { useState } from 'react';

import { Box, IconButton, Tooltip, Typography } from '@material-ui/core';
import FileCopyIcon from '@material-ui/icons/FileCopy';

import { useTranslation } from '../hooks/useTranslation';

const TRUNCATE_THRESHOLD = 12;

const truncate = (value: string) =>
  value.length > TRUNCATE_THRESHOLD
    ? `${value.slice(0, 6)}…${value.slice(-4)}`
    : value;

export const TruncatedId = ({ value }: { value: string }) => {
  const { t } = useTranslation();
  const short = truncate(value);
  const isTruncated = short !== value;
  const [copyFailed, setCopyFailed] = useState(false);
  const clipboard =
    typeof window === 'undefined' ? undefined : window.navigator.clipboard;
  const canCopy = typeof clipboard?.writeText === 'function';
  const copyLabel = t('modulePage.phases.copyToClipboard');
  let copyStatus = copyLabel;
  if (!canCopy) {
    copyStatus = t('modulePage.phases.copyUnavailable');
  } else if (copyFailed) {
    copyStatus = t('modulePage.phases.copyFailed');
  }

  const handleCopy = async () => {
    if (!clipboard?.writeText) return;

    try {
      await clipboard.writeText(value);
      setCopyFailed(false);
    } catch {
      setCopyFailed(true);
    }
  };

  return (
    <Box display="inline-flex" alignItems="center">
      {isTruncated ? (
        <Tooltip title={value}>
          <Typography variant="body2" component="span">
            {short}
          </Typography>
        </Tooltip>
      ) : (
        <Typography variant="body2" component="span">
          {value}
        </Typography>
      )}
      <Tooltip title={copyStatus}>
        <Box component="span">
          <IconButton
            aria-label={copyStatus}
            size="small"
            disabled={!canCopy}
            onClick={handleCopy}
            style={{ padding: 2, marginLeft: 2 }}
          >
            <FileCopyIcon style={{ fontSize: '0.85rem' }} />
          </IconButton>
        </Box>
      </Tooltip>
    </Box>
  );
};
