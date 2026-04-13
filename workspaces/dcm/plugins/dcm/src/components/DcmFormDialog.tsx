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

import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { useDcmStyles } from './dcmStyles';

export type DcmFormDialogProps = Readonly<{
  open: boolean;
  onClose: () => void;
  title: string;
  /** Form body (fields) */
  children: React.ReactNode;
  /** Footer row (typically primary + cancel buttons) */
  actions: React.ReactNode;
  maxWidth?: React.ComponentProps<typeof Dialog>['maxWidth'];
}>;

/**
 * Shared modal shell for Data Center register/edit flows (title, close, content, actions).
 */
export function DcmFormDialog({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
}: DcmFormDialogProps) {
  const classes = useDcmStyles();
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth>
      <DialogTitle className={classes.dialogTitle}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
        >
          <Typography
            variant="h4"
            component="span"
            className={classes.dialogTitleText}
          >
            {title}
          </Typography>
          <IconButton
            aria-label="Close"
            onClick={onClose}
            size="small"
            className={classes.dialogTitleCloseBtn}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent className={classes.dialogContent}>
        {children}
      </DialogContent>
      <DialogActions className={classes.dialogActions}>{actions}</DialogActions>
    </Dialog>
  );
}
