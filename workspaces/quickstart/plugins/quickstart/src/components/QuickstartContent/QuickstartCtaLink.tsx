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
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';

import { useTranslation } from '../../hooks/useTranslation';
import { getTranslatedTextWithFallback } from '../../utils';
import { QuickstartItemCtaData } from '../../types';

export type QuickstartCtaLinkProps = {
  cta?: QuickstartItemCtaData;
  onClick: () => void;
};

export const QuickstartCtaLink = ({ cta, onClick }: QuickstartCtaLinkProps) => {
  const { t } = useTranslation();

  if (!cta) {
    return (
      <Button color="primary" variant="outlined" onClick={onClick}>
        {t('button.gotIt')}
      </Button>
    );
  }

  const finalText = getTranslatedTextWithFallback(t, cta.textKey, cta.text);
  const isExternalLink =
    cta.link.startsWith('http://') || cta.link.startsWith('https://');

  if (isExternalLink) {
    return (
      <Button
        color="primary"
        variant="outlined"
        component="a"
        href={cta.link}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        endIcon={<OpenInNewIcon sx={{ fontSize: 15 }} />}
        sx={{ gap: '5px' }}
      >
        {finalText}
      </Button>
    );
  }

  return (
    <Button
      color="primary"
      variant="outlined"
      component={Link}
      to={cta.link}
      onClick={onClick}
    >
      {finalText}
    </Button>
  );
};
