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
import { Button, ButtonLink } from '@backstage/ui';

import { useTranslation } from '../../hooks/useTranslation';
import { getTranslatedTextWithFallback } from '../../utils';
import { QuickstartItemCtaData } from '../../types';
import { QuickstartIcon } from './QuickstartIcon';

export type QuickstartCtaLinkProps = {
  cta?: QuickstartItemCtaData;
  onClick: () => void;
};

export const QuickstartCtaLink = ({ cta, onClick }: QuickstartCtaLinkProps) => {
  const { t } = useTranslation();

  if (!cta) {
    return (
      <Button variant="secondary" onPress={onClick}>
        {t('button.gotIt')}
      </Button>
    );
  }

  const finalText = getTranslatedTextWithFallback(t, cta.textKey, cta.text);
  const isExternalLink =
    cta.link.startsWith('http://') || cta.link.startsWith('https://');

  if (isExternalLink) {
    return (
      <ButtonLink
        href={cta.link}
        target="_blank"
        rel="noopener noreferrer"
        variant="secondary"
        onPress={onClick}
        iconEnd={<QuickstartIcon icon="open_in_new" size="small" />}
      >
        {finalText}
      </ButtonLink>
    );
  }

  return (
    <ButtonLink href={cta.link} variant="secondary" onPress={onClick}>
      {finalText}
    </ButtonLink>
  );
};
