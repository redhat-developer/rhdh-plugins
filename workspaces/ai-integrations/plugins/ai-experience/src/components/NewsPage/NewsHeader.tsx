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
import { FC } from 'react';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { Header } from '@backstage/core-components';
import { useTranslation } from '../../hooks/useTranslation';

export const NewsHeader: FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <Header
      pageTitleOverride={t('news.pageTitle')}
      title={
        <Typography
          color="textPrimary"
          style={{
            fontWeight: 700,
            fontSize: theme.typography.h2.fontSize,
            fontFamily: theme.typography.body1.fontFamily,
          }}
        >
          {t('news.pageTitle')}
        </Typography>
      }
    />
  );
};
