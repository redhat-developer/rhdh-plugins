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
import { makeStyles } from '@material-ui/core/styles';
import CheckIcon from '@material-ui/icons/Check';
import FileCopyOutlinedIcon from '@material-ui/icons/FileCopyOutlined';

const useStyles = makeStyles(theme => ({
  copyButton: {
    padding: theme.spacing(0.25),
    marginLeft: theme.spacing(0.5),
  },
  copiedIcon: {
    fontSize: 14,
    color: '#28a745',
  },
  copyIcon: {
    fontSize: 14,
  },
}));

/** Icon button that copies text to the clipboard and shows a brief checkmark. */
export function CopyButton({ text }: Readonly<{ text: string }>) {
  const classes = useStyles();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    globalThis.navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Tooltip title={copied ? 'Copied!' : 'Copy'} placement="top">
      <IconButton
        size="small"
        onClick={handleCopy}
        aria-label="Copy to clipboard"
        className={classes.copyButton}
      >
        {copied ? (
          <CheckIcon className={classes.copiedIcon} />
        ) : (
          <FileCopyOutlinedIcon className={classes.copyIcon} />
        )}
      </IconButton>
    </Tooltip>
  );
}
