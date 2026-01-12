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

import { InfoCard } from '@backstage/core-components';

import Button from '@mui/material/Button';
import { useState } from 'react';

import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { TranslationRef } from '@backstage/core-plugin-api/alpha';
import { useTranslation } from '../hooks/useTranslation';

/**
 * @public
 * @param resources - The resources to export
 * @returns The exported translations
 * @example
 * <ExportTranslationKeys resources={resources} />
 */
export const ExportTranslationKeys = ({
  resources,
}: {
  resources: TranslationRef[];
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  function downloadTranslations(
    translations: Record<string, any>,
  ): Promise<void> {
    return new Promise(resolve => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
      const timestamp = `${day}-${month}-${year}-${hours}-${minutes}-${seconds}-${milliseconds}`;

      const blob = new Blob(
        [JSON.stringify(translations, null, 2)], // pretty print with 2 spaces
        { type: 'application/json' },
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = t('export.filename', { timestamp } as any);
      link.click();

      // Clean up after a short delay to ensure download starts
      setTimeout(() => {
        URL.revokeObjectURL(url);
        resolve();
      }, 100);
    });
  }

  return (
    <InfoCard title={t('export.title')}>
      <Button
        variant="text"
        startIcon={<FileDownloadOutlinedIcon />}
        disabled={isLoading}
        onClick={async () => {
          if (isLoading) return;

          setIsLoading(true);
          try {
            const finalJson: any = {};
            resources.forEach(resource => {
              finalJson[resource.id] = {
                en: (resource as any)?.getDefaultMessages(),
              };
            });
            await downloadTranslations(finalJson);
          } finally {
            setIsLoading(false);
          }
        }}
        sx={{
          fontSize: '1rem !important',
          '&:hover': {
            backgroundColor: 'transparent !important',
          },
        }}
      >
        {t('export.downloadButton')}
      </Button>
    </InfoCard>
  );
};
