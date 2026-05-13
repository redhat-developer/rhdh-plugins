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

import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { makeStyles } from '../../utils/makeStyles';
import { FileTypeIcon } from './FileTypeIcon';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: 8,
    backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
    marginBottom: 8,
    '&:last-child': {
      marginBottom: 0,
    },
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 12,
  },
  fileName: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '0.875rem',
  },
  fileSize: {
    color: theme.palette.text.secondary,
    fontSize: '0.75rem',
    flexShrink: 0,
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
    color: theme.palette.action.active,
    '&:hover': {
      color: theme.palette.error.main,
    },
  },
}));

type FileListItemProps = {
  file: File;
  onRemove: () => void;
  removeAriaLabel?: string;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const MAX_FILENAME_LENGTH = 30;

const truncateFileName = (fileName: string, maxLength: number): string => {
  if (fileName.length <= maxLength) return fileName;

  const lastDot = fileName.lastIndexOf('.');
  const extension = lastDot >= 0 ? fileName.slice(lastDot) : '';
  const baseName = lastDot >= 0 ? fileName.slice(0, lastDot) : fileName;

  const availableLength = maxLength - extension.length - 3;
  if (availableLength <= 0) return fileName;

  return `${baseName.slice(0, availableLength)}...${extension}`;
};

export const FileListItem = ({
  file,
  onRemove,
  removeAriaLabel = 'Remove file',
}: FileListItemProps) => {
  const classes = useStyles();
  const displayName = truncateFileName(file.name, MAX_FILENAME_LENGTH);

  return (
    <Box className={classes.container}>
      <Box className={classes.fileInfo}>
        <FileTypeIcon fileName={file.name} />
        <Typography className={classes.fileName} title={file.name}>
          {displayName}
        </Typography>
      </Box>
      <Typography className={classes.fileSize}>
        {formatFileSize(file.size)}
      </Typography>
      <IconButton
        className={classes.removeButton}
        onClick={onRemove}
        aria-label={removeAriaLabel}
        size="small"
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};
