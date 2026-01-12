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

import { CodeSnippet, WarningPanel } from '@backstage/core-components';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  EXTENSIONS_CONFIG_YAML,
  generateExtensionsEnableLineNumbers,
} from '../utils';
import { useTranslation } from '../hooks/useTranslation';

const PRODUCTION_DOCS_URL =
  'https://docs.redhat.com/en/documentation/red_hat_developer_hub/latest/html/installing_and_viewing_plugins_in_red_hat_developer_hub/rhdh-extensions-plugins_assembly-install-third-party-plugins-rhdh#con-extensions-managing-plugins_rhdh-extensions-plugins';

const EXTENSIONS_ENABLE_DOCS_URL =
  'https://docs.redhat.com/en/documentation/red_hat_developer_hub/latest/html/installing_and_viewing_plugins_in_red_hat_developer_hub/rhdh-extensions-plugins_assembly-install-third-party-plugins-rhdh#proc-extensions-enabling-plugins-installation_rhdh-extensions-plugins';

export const ProductionEnvironmentAlert = () => {
  const { t } = useTranslation();

  return (
    <Alert severity="info" sx={{ mb: '1rem' }}>
      <AlertTitle>
        {t('alert.productionDisabled')}
        <Button color="primary" target="_blank" href={PRODUCTION_DOCS_URL}>
          {t('button.viewDocumentation')} &nbsp; <OpenInNewIcon />
        </Button>
      </AlertTitle>
    </Alert>
  );
};

export const ExtensionsConfigurationAlert = () => {
  const { t } = useTranslation();

  return (
    <>
      <WarningPanel
        title={t('alert.installationDisabled')}
        severity="info"
        message={
          <>
            {t('alert.extensionsExample')}
            <CodeSnippet
              language="yaml"
              showLineNumbers
              highlightedNumbers={generateExtensionsEnableLineNumbers()}
              text={EXTENSIONS_CONFIG_YAML}
            />
            <Button
              color="primary"
              target="_blank"
              href={EXTENSIONS_ENABLE_DOCS_URL}
            >
              {t('button.viewDocumentation')} &nbsp; <OpenInNewIcon />
            </Button>
          </>
        }
      />
      <br />
    </>
  );
};

type BackendRestartAlertProps = {
  count: number;
  itemInfo: React.ReactNode;
  viewItemsLabel: string;
  onViewItems: () => void;
};

export const BackendRestartAlert = ({
  count,
  itemInfo,
  viewItemsLabel,
  onViewItems,
}: BackendRestartAlertProps) => {
  const { t } = useTranslation();

  if (count === 0) {
    return null;
  }

  return (
    <Alert severity="info" sx={{ mb: '1rem' }}>
      <AlertTitle>{t('alert.backendRestartRequired')}</AlertTitle>
      {itemInfo}
      {count > 1 && (
        <Typography component="div" sx={{ pt: '8px' }}>
          <Link component="button" underline="none" onClick={onViewItems}>
            {viewItemsLabel}
          </Link>
        </Typography>
      )}
    </Alert>
  );
};
