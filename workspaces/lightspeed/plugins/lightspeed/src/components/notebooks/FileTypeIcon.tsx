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

import { makeStyles } from '@material-ui/core';

const FILE_TYPE_COLORS: Record<string, string> = {
  pdf: '#C9190B',
  yaml: '#F0AB00',
  yml: '#F0AB00',
  json: '#F0AB00',
  csv: '#3E8635',
  txt: '#6A6E73',
  md: '#0066CC',
  log: '#6A6E73',
  docx: '#004B95',
  odt: '#009596',
  html: '#EC7A08',
  xml: '#0066CC',
  rtf: '#8476D1',
  pptx: '#C9190B',
};

const DEFAULT_COLOR = '#6A6E73';

const useStyles = makeStyles(() => ({
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 28,
    height: 22,
    padding: '0 4px',
    borderRadius: 4,
    border: '1.5px solid',
    fontSize: '0.625rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    lineHeight: 1,
    flexShrink: 0,
  },
}));

type FileTypeIconProps = {
  fileName: string;
  className?: string;
};

const getExtension = (fileName: string): string => {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot >= 0 ? fileName.slice(lastDot + 1).toLowerCase() : '';
};

export const FileTypeIcon = ({ fileName, className }: FileTypeIconProps) => {
  const classes = useStyles();
  const ext = getExtension(fileName);
  const color = FILE_TYPE_COLORS[ext] ?? DEFAULT_COLOR;
  const label = ext || '?';

  return (
    <span
      className={`${classes.badge}${className ? ` ${className}` : ''}`}
      style={{ borderColor: color, color }}
    >
      {label}
    </span>
  );
};
