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
import { IconButton, Tooltip } from '@material-ui/core';
import FileCopyOutlinedIcon from '@material-ui/icons/FileCopyOutlined';
import { useTranslation } from '../../../hooks/useTranslation';

type CopyState = 'idle' | 'copied' | 'failed';

export function CopyButton({ text }: Readonly<{ text: string }>) {
  const { t } = useTranslation();
  const [state, setState] = useState<CopyState>('idle');

  const handleCopy = async () => {
    try {
      await window.navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      setState('failed');
    } finally {
      setTimeout(() => setState('idle'), 2000);
    }
  };

  let label: string;
  if (state === 'copied') {
    label = t('copyButton.copied');
  } else if (state === 'failed') {
    label = t('copyButton.failed');
  } else {
    label = t('copyButton.copy');
  }

  return (
    <Tooltip title={label} placement="top">
      <IconButton
        size="small"
        onClick={handleCopy}
        aria-label={t('copyButton.ariaLabel')}
      >
        <FileCopyOutlinedIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
