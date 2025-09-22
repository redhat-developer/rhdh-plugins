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

import { forwardRef, ForwardRefRenderFunction, ReactNode } from 'react';

import Close from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { makeStyles } from 'tss-react/mui';

export type InfoDialogProps = {
  title: ReactNode;
  titleIcon?: ReactNode;
  open: boolean;
  onClose?: () => void;
  dialogActions?: ReactNode;
  children?: ReactNode;
  wideDialog?: boolean;
};

export type ParentComponentRef = HTMLDivElement;

const useStyles = makeStyles()(theme => ({
  dialogTitle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContent: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  titleText: {
    lineHeight: 1,
    margin: 0,
  },
  closeBtn: {
    flexShrink: 0,
  },
  dialogActions: {
    justifyContent: 'flex-start',
    paddingLeft: theme.spacing(3),
    paddingTop: 0,
    paddingBottom: theme.spacing(4),
  },
  dialogContent: {
    '& > div': {
      backgroundColor: 'transparent',
    },
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
  const { classes } = useStyles();

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
        <Box className={classes.dialogTitle}>
          <Box className={classes.titleContent}>
            {titleIcon}
            <Typography variant="h4" className={classes.titleText}>
              <b>{title}</b>
            </Typography>
          </Box>

          <IconButton
            className={classes.closeBtn}
            aria-label="close"
            onClick={onClose}
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent className={classes.dialogContent}>
        {children}
      </DialogContent>
      <DialogActions className={classes.dialogActions}>
        {dialogActions}
      </DialogActions>
    </Dialog>
  );
};
export const InfoDialog = forwardRef(RefForwardingInfoDialog);
