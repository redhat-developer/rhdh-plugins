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

import { makeStyles } from '@material-ui/core/styles';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useTranslation } from '../../hooks/useTranslation';
import { Trans } from '../Trans';

const useStyles = makeStyles(theme => ({
  dialogPaper: {
    borderRadius: 16,
  },
  dialogTitle: {
    padding: '16px 20px',
    fontStyle: 'inherit',
  },
  dialogContent: {
    paddingTop: 0,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  titleText: {
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.text.primary,
  },
  dialogActions: {
    justifyContent: 'left',
    padding: theme.spacing(2.5),
    gap: theme.spacing(1),
  },
  removeButton: {
    textTransform: 'none',
    borderRadius: 999,
  },
  cancelButton: {
    textTransform: 'none',
    borderRadius: 999,
  },
}));

type DeleteDocumentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  documentName: string;
};

export const DeleteDocumentModal = ({
  isOpen,
  onClose,
  onConfirm,
  documentName,
}: DeleteDocumentModalProps) => {
  const classes = useStyles();
  const { t } = useTranslation();

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      aria-labelledby="delete-document-modal"
      aria-describedby="delete-document-modal-body"
      fullWidth
      PaperProps={{
        className: classes.dialogPaper,
      }}
    >
      <DialogTitle className={classes.dialogTitle}>
        <Box className={classes.titleRow}>
          <Typography component="span" className={classes.titleText}>
            {t('notebook.document.delete.title')}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            title={t('common.close')}
            size="large"
            className={classes.closeButton}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent
        id="delete-document-modal-body"
        className={classes.dialogContent}
      >
        <Typography variant="body2">
          <Trans
            message="notebook.document.delete.description"
            components={{
              '<documentName/>': <strong>{documentName}</strong>,
            }}
          />
        </Typography>
      </DialogContent>
      <DialogActions className={classes.dialogActions}>
        <Button
          variant="contained"
          color="error"
          className={classes.removeButton}
          onClick={onConfirm}
        >
          {t('notebook.document.delete.action')}
        </Button>
        <Button
          variant="outlined"
          className={classes.cancelButton}
          onClick={onClose}
        >
          {t('common.cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
