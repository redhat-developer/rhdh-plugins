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

import { useEffect, useState } from 'react';

import { TextField } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import CloseIcon from '@mui/icons-material/Close';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useRenameNotebook } from '../hooks/useRenameNotebook';
import { useTranslation } from '../hooks/useTranslation';

const useStyles = makeStyles(theme => ({
  dialogPaper: {
    borderRadius: 16,
  },
  dialogTitle: {
    padding: '16px 20px',
    fontStyle: 'inherit',
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
    color: theme.palette.grey[700],
  },
  dialogContent: {
    paddingTop: 0,
    paddingLeft: theme.spacing(2.5),
  },
  description: {
    marginBottom: theme.spacing(3),
  },
  textField: {
    marginTop: 0,
  },
  errorBox: {
    maxWidth: 650,
    marginLeft: theme.spacing(2.5),
    marginRight: theme.spacing(2.5),
  },
  dialogActions: {
    justifyContent: 'left',
    padding: theme.spacing(2.5),
    gap: theme.spacing(1),
  },
  submitButton: {
    textTransform: 'none',
    borderRadius: 999,
    backgroundColor: 'var(--pf-t--global--color--brand--default)',
    '&:hover': {
      backgroundColor: 'var(--pf-t--global--color--brand--default)',
    },
  },
  cancelButton: {
    textTransform: 'none',
    borderRadius: 999,
  },
}));

export const RenameNotebookModal = ({
  isOpen,
  onClose,
  sessionId,
  currentName,
}: {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  currentName: string;
}) => {
  const classes = useStyles();
  const { t } = useTranslation();
  const { mutateAsync: renameNotebook, isError, error } = useRenameNotebook();
  const [name, setName] = useState<string>('');
  const [originalName, setOriginalName] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setOriginalName(currentName);
    }
  }, [isOpen, currentName]);

  const handleRename = async () => {
    try {
      await renameNotebook({ sessionId, name });
      onClose();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(e);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      aria-labelledby="rename-notebook-modal"
      aria-describedby="rename-notebook-modal-body"
      fullWidth
      PaperProps={{
        className: classes.dialogPaper,
      }}
    >
      <DialogTitle className={classes.dialogTitle}>
        <Box className={classes.titleRow}>
          <Typography component="span" className={classes.titleText}>
            {t('notebooks.rename.title').replace('{{name}}', currentName)}
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
        id="rename-notebook-modal-body"
        className={classes.dialogContent}
      >
        <Typography
          variant="body2"
          color="textSecondary"
          className={classes.description}
        >
          {t('notebooks.rename.description')}
        </Typography>
        <TextField
          id="outlined-notebook-name-input"
          label={t('notebooks.rename.label')}
          onChange={event => setName(event.target.value)}
          fullWidth
          value={name}
          className={classes.textField}
          variant="outlined"
          placeholder={t('notebooks.rename.placeholder')}
          InputProps={{
            autoFocus: true,
          }}
        />
      </DialogContent>
      {isError && (
        <Box className={classes.errorBox}>
          <Alert severity="error">{String(error)}</Alert>
        </Box>
      )}
      <DialogActions className={classes.dialogActions}>
        <Button
          variant="contained"
          className={classes.submitButton}
          disabled={name.trim() === '' || name.trim() === originalName.trim()}
          onClick={handleRename}
        >
          {t('notebooks.rename.action')}
        </Button>
        <Button
          key="cancel"
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
