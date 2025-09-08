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
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from '../../hooks/useTranslation';

const CustomLegend = (props: any) => {
  const theme = useTheme();
  const { payload } = props;
  const { t } = useTranslation();

  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        marginLeft: 50,
        paddingTop: 10,
      }}
    >
      {payload.map((entry: any) => (
        <div
          key={entry.value}
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <div>
            <div
              style={{
                width: 20,
                height: 4,
                backgroundColor: entry.color,
              }}
            />
            <div
              style={{
                width: 20,
                height: 4,
                backgroundColor: entry.color,
                opacity: '0.4',
              }}
            />
          </div>
          <Typography
            variant="body2"
            style={{ color: theme.palette.text.primary, fontSize: '0.875rem' }}
          >
            {entry.value === 'new_users'
              ? t('activeUsers.legend.newUsers')
              : t('activeUsers.legend.returningUsers')}
          </Typography>
        </div>
      ))}
    </div>
  );
};

export default CustomLegend;
