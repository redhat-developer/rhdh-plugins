/*
 * Copyright The Backstage Authors
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

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import CloseIcon from '@mui/icons-material/Close';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { useInstallationContext } from './InstallationContext';
import { useTranslation } from '../hooks/useTranslation';

const PluginsTable = ({ showPackages }: { showPackages?: boolean }) => {
  const { t } = useTranslation();
  const { installedPlugins, installedPackages } = useInstallationContext();
  return (
    <Table aria-label={t('table.pluginsTable')}>
      <TableHead>
        <TableRow>
          <TableCell>{t('table.name')}</TableCell>
          <TableCell align="left">{t('table.action')}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {Object.entries(
          showPackages ? installedPackages : installedPlugins,
        ).map(row => (
          <TableRow key={row[0]}>
            <TableCell component="th" scope="row">
              {row[0]}
            </TableCell>
            <TableCell align="left">{row[1]}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export const InstalledPluginsDialog = ({
  open,
  onClose,
  showPackages,
}: {
  open: boolean;
  showPackages?: boolean;
  onClose: (close: boolean) => void;
}) => {
  const { t } = useTranslation();
  const handleClose = () => {
    onClose(false);
  };
  if (open) {
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="installed-plugins-dialog"
      >
        <DialogTitle sx={{ p: '16px 20px', fontStyle: 'inherit' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Typography component="span" sx={{ fontWeight: 'bold' }}>
              {t('dialog.backendRestartRequired')}
            </Typography>

            <IconButton
              aria-label="close"
              onClick={handleClose}
              title={t('common.close')}
              size="large"
              sx={{
                position: 'absolute',
                right: 1,
                top: 1,
                color: 'grey.700',
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <PluginsTable showPackages={showPackages} />
          <br />
          <Typography variant="body1">
            {showPackages
              ? t('dialog.packageRestartMessage')
              : t('dialog.pluginRestartMessage')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'left', p: '20px' }}>
          <Button
            variant="contained"
            sx={{
              textTransform: 'none',
            }}
            onClick={handleClose}
          >
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
  return null;
};
