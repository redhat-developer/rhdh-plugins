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

import { Button } from '@backstage/ui';
import { RiExternalLinkLine } from '@remixicon/react';
import { useNavigate } from 'react-router-dom';

import { useTranslation } from '../../hooks/useTranslation';
import { getTranslatedTextWithFallback } from '../../utils';
import { QuickstartItemCtaData } from '../../types';

export type QuickstartCtaLinkProps = {
  cta?: QuickstartItemCtaData;
  onClick: () => void;
};

/**
 * MUI LinkButton `variant="outlined"` → BUI Button `variant="secondary"`.
 * RHDH theme styles secondary as PatternFly outlined buttons.
 */
export const QuickstartCtaLink = ({ cta, onClick }: QuickstartCtaLinkProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!cta) {
    return (
      <Button variant="secondary" onPress={() => onClick()}>
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
        variant="secondary"
        iconEnd={<RiExternalLinkLine size={15} />}
        onPress={() => {
          onClick();
          window.open(cta.link, '_blank', 'noopener,noreferrer');
        }}
      >
        {finalText}
      </Button>
    );
  }

  return (
    <Button
      variant="secondary"
      onPress={() => {
        onClick();
        navigate(cta.link);
      }}
    >
      {finalText}
    </Button>
  );
};
