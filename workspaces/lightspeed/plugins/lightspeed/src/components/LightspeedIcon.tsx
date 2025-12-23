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

import { useTheme } from '@mui/material/styles';

import { useTranslation } from '../hooks/useTranslation';
import logoDark from '../images/logo-black.svg';
import logo from '../images/logo-white.svg';
import roundedLogo from '../images/rounded-logo.svg';

/**
 * @public
 * Lightspeed Icon
 */
export const LightspeedIcon = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDarkTheme = theme.palette.mode === 'dark';

  return (
    <img
      src={(isDarkTheme ? logo : logoDark) as any}
      alt={t('icon.lightspeed.alt')}
      style={{ height: '25px' }}
    />
  );
};

/**
 * @public
 * Lightspeed FAB Icon */
export const LightspeedFABIcon = () => {
  const { t } = useTranslation();

  return (
    <img
      data-testid="lightspeed-fab-icon"
      src={roundedLogo as any}
      alt={t('icon.lightspeed.alt')}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  );
};
