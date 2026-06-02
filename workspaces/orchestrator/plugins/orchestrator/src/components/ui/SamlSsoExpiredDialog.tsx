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

import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { useTranslation } from '../../hooks/useTranslation';
import { InfoDialog } from './InfoDialog';

export interface SamlSsoExpiredDialogProps {
  open: boolean;
  reauthorizeUrl?: string;
  onClose: () => void;
}

export const SamlSsoExpiredDialog: React.FC<SamlSsoExpiredDialogProps> = ({
  open,
  reauthorizeUrl,
  onClose,
}) => {
  const { t } = useTranslation();
  return (
    <InfoDialog
      title={t('samlSso.title')}
      titleIcon={<WarningAmberOutlined color="warning" />}
      open={open}
      onClose={onClose}
      dialogActions={
        <>
          {reauthorizeUrl && (
            <Button
              variant="contained"
              color="primary"
              href={reauthorizeUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('samlSso.reauthorizeButton')}
            </Button>
          )}
          <Button variant="outlined" color="primary" onClick={onClose}>
            {t('common.close')}
          </Button>
        </>
      }
    >
      <Typography variant="body1" sx={{ mb: 2 }}>
        {t('samlSso.body')}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {reauthorizeUrl
          ? t('samlSso.reauthorizeHint')
          : t('samlSso.fallbackHint')}
      </Typography>
    </InfoDialog>
  );
};

SamlSsoExpiredDialog.displayName = 'SamlSsoExpiredDialog';
