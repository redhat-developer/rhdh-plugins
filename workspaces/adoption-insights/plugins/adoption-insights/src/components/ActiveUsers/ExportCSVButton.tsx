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
import { useRef, useState } from 'react';

import { useApi } from '@backstage/core-plugin-api';
import Button from '@mui/material/Button';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { format } from 'date-fns';

import { adoptionInsightsApiRef } from '../../api';
import { useDateRange } from '../Header/DateRangeContext';
import { useTranslation } from '../../hooks/useTranslation';

const ExportCSVButton = () => {
  const [loading, setLoading] = useState(false);
  const api = useApi(adoptionInsightsApiRef);
  const { startDateRange, endDateRange } = useDateRange();
  const theme = useTheme();
  const { t } = useTranslation();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleCSVDownload = async () => {
    try {
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss-SSS');
      await api.downloadBlob({
        type: 'active_users',
        start_date: startDateRange
          ? format(startDateRange, 'yyyy-MM-dd')
          : undefined,
        end_date: endDateRange ? format(endDateRange, 'yyyy-MM-dd') : undefined,
        timezone: new Intl.DateTimeFormat().resolvedOptions().timeZone,
        format: 'csv',
        blobName: `${t('common.csvFilename')}_${timestamp}.csv`,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('CSV Download failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedHandleCSVDownload = () => {
    setLoading(true);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      handleCSVDownload();
    }, 500);
  };

  return (
    <Box
      sx={{
        height: '100%',
        minWidth: 160,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 16px', // Add padding for better spacing from card border
      }}
    >
      <Button
        variant="text"
        startIcon={<FileDownloadOutlinedIcon />}
        onClick={debouncedHandleCSVDownload}
        sx={{
          color: theme.palette.primary.main,
          textTransform: 'none',
          fontSize: '1rem',
          fontWeight: 400,
          textDecoration: 'none',
          '&:hover': {
            backgroundColor: 'transparent',
            textDecoration: 'none',
          },
        }}
      >
        {loading ? t('common.downloading') : t('common.exportCSV')}
      </Button>
    </Box>
  );
};

export default ExportCSVButton;
