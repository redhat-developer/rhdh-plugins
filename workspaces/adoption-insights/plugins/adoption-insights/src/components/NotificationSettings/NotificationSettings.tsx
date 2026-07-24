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
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';

import { useNotificationPreference } from '../../hooks/useNotificationPreference';
import { useTranslation } from '../../hooks/useTranslation';
import type { NotificationFrequency } from '../../types';

const FREQUENCY_OPTIONS: ReadonlyArray<{
  value: NotificationFrequency;
  label: string;
}> = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'none', label: 'No notifications' },
];

const NotificationSettings = () => {
  const { frequency, setFrequency, loading } = useNotificationPreference();
  const { t } = useTranslation();

  if (loading) return null;

  return (
    <Card>
      <CardHeader
        title={t('notifications.title')}
        subheader={
          <Typography variant="body2" color="textSecondary">
            {t('notifications.description')}
          </Typography>
        }
      />
      <CardContent>
        <FormControl fullWidth size="small" sx={{ maxWidth: 300 }}>
          <InputLabel>{t('notifications.frequencyLabel')}</InputLabel>
          <Select
            value={frequency}
            label={t('notifications.frequencyLabel')}
            onChange={e =>
              setFrequency(e.target.value as NotificationFrequency)
            }
          >
            {FREQUENCY_OPTIONS.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
