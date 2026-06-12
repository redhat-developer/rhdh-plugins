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

import { RhUiAiChatbotIcon } from '@patternfly/react-icons/dist/esm/icons/rh-ui-ai-chatbot-icon';
import { RhUiAiExperienceIcon } from '@patternfly/react-icons/dist/esm/icons/rh-ui-ai-experience-icon';

import { useTranslation } from '../hooks/useTranslation';

/**
 * @public
 * Intelligent Assistant Icon
 */
export const LightspeedIcon = () => {
  const { t } = useTranslation();

  return (
    <RhUiAiExperienceIcon
      aria-label={t('icon.lightspeed.alt')}
      style={{ height: '25px', width: '25px' }}
    />
  );
};

/**
 * @public
 * Intelligent Assistant FAB Icon
 */
export const LightspeedFABIcon = () => {
  const { t } = useTranslation();

  return (
    <RhUiAiChatbotIcon
      data-testid="lightspeed-fab-icon"
      aria-label={t('icon.lightspeed.alt')}
      style={{
        width: '32px',
        height: '32px',
        display: 'block',
      }}
    />
  );
};

/**
 * @public
 * Chevron-down icon for FAB dismiss/close state
 */
export const LightspeedFABOpenIcon = () => (
  <svg
    data-testid="lightspeed-fab-open-icon"
    width="22"
    height="14"
    viewBox="0 0 22 14"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Close"
  >
    <path d="M21.2485 0.35154C20.7798 -0.11718 20.0204 -0.11718 19.5516 0.35154L10.8 9.10314L2.0485 0.35154C1.57978 -0.11718 0.820425 -0.11718 0.351585 0.35154C-0.117255 0.82026 -0.117135 1.57962 0.351585 2.04846L9.52738 11.2243C9.87778 11.5759 10.3395 11.7505 10.8 11.7505C11.2604 11.7505 11.7223 11.5759 12.0726 11.2243L21.2484 2.04846C21.7171 1.57974 21.7172 0.82038 21.2485 0.35154Z" />
  </svg>
);
