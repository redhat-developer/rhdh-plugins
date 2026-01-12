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

import type { ReactElement } from 'react';
import { makeStyles } from 'tss-react/mui';

import { isValidElement } from 'react';
import { useApp } from '@backstage/core-plugin-api';

import MuiIcon from '@mui/material/Icon';

const useStyles = makeStyles()({
  img: {
    height: '40px',
    width: 'auto',
  },
});

export const QuickAccessIcon = ({
  icon,
  alt,
}: {
  icon: string | ReactElement;
  alt: string;
}) => {
  const { classes } = useStyles();
  const app = useApp();

  if (!icon) {
    return null;
  }

  if (isValidElement(icon)) {
    return icon;
  }

  const strIcon = icon as string;

  const SystemIcon = app.getSystemIcon(strIcon);

  if (SystemIcon) {
    return <SystemIcon fontSize="large" />;
  }

  if (strIcon.startsWith('<svg')) {
    const svgDataUri = `data:image/svg+xml;base64,${btoa(strIcon)}`;
    return <img src={svgDataUri} className={classes.img} alt={alt} />;
  }

  if (
    strIcon.startsWith('https://') ||
    strIcon.startsWith('http://') ||
    strIcon.startsWith('/') ||
    strIcon.startsWith('data:image/')
  ) {
    return <img src={strIcon} className={classes.img} alt={alt} />;
  }

  return <MuiIcon baseClassName="material-icons-outlined">{strIcon}</MuiIcon>;
};
