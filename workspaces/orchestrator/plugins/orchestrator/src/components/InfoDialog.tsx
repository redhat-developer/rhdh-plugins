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

import React, { forwardRef, ForwardRefRenderFunction } from 'react';

import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  makeStyles,
  Typography,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';

export type InfoDialogProps = {
  title: React.ReactNode;
  titleIcon?: React.ReactNode;
  open: boolean;
  onClose?: () => void;
  dialogActions?: React.ReactNode;
  children?: React.ReactNode;
  wideDialog?: boolean;
};

export type ParentComponentRef = HTMLElement;

const useStyles = makeStyles(theme => ({
  closeBtn: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
  },
  dialogActions: {
    justifyContent: 'flex-start',
    paddingLeft: theme.spacing(3),
    paddingBottom: theme.spacing(2),
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: theme.spacing(1),
  },
}));

export const RefForwardingInfoDialog: ForwardRefRenderFunction<
  ParentComponentRef,
  InfoDialogProps
> = (props, forwardedRef): JSX.Element | null => {
  const {
    title,
    titleIcon,
    open = false,
    onClose,
    children,
    dialogActions,
    wideDialog,
  } = props;
  const classes = useStyles();

  return (
    <Dialog
      onClose={_ => onClose}
      open={open}
      ref={forwardedRef}
      maxWidth={wideDialog ? 'xl' : 'sm'}
      PaperProps={{
        style: { minWidth: wideDialog ? 500 : 400 },
      }}
    >
      <DialogTitle>
        <Box className={classes.titleContainer}>
          {titleIcon && <Box className={classes.titleIcon}>{titleIcon}</Box>}
          <Typography variant="h4">
            <b>{title}</b>
          </Typography>
          <IconButton
            className={classes.closeBtn}
            aria-label="close"
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box>{children}</Box>
      </DialogContent>
      <DialogActions className={classes.dialogActions}>
        {dialogActions}
      </DialogActions>
    </Dialog>
  );
};

export const InfoDialog = forwardRef(RefForwardingInfoDialog);
