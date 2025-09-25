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
import { QuickstartItemCtaData } from '../../types';
import { LinkButton } from '@backstage/core-components';
import { useTranslation } from '../../hooks/useTranslation';
import { getTranslatedTextWithFallback } from '../../utils';

export type QuickstartCtaLinkProps = {
  cta?: QuickstartItemCtaData;
  onClick: () => void;
};

export const QuickstartCtaLink = ({ cta, onClick }: QuickstartCtaLinkProps) => {
  const { t } = useTranslation();
  // If no CTA is provided, show a default "Got it!" button
  if (!cta) {
    return (
      <LinkButton
        color="primary"
        variant="outlined"
        to="#"
        onClick={e => {
          e.preventDefault();
          onClick();
        }}
      >
        {t('button.gotIt')}
      </LinkButton>
    );
  }

  const finalText = getTranslatedTextWithFallback(t, cta.textKey, cta.text);

  const isExternalLink =
    cta.link.startsWith('http://') || cta.link.startsWith('https://');

  return isExternalLink ? (
    <LinkButton
      color="primary"
      style={{
        gap: '5px',
      }}
      variant="outlined"
      to={cta.link}
      onClick={onClick}
    >
      {finalText}
      &nbsp;
      <OpenInNewIcon
        sx={{
          fontSize: '15px',
        }}
      />
    </LinkButton>
  ) : (
    <LinkButton
      color="primary"
      variant="outlined"
      to={cta.link}
      onClick={onClick}
    >
      {finalText}
    </LinkButton>
  );
};
