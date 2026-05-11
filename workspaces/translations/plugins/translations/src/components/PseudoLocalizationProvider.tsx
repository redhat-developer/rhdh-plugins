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

import { type PropsWithChildren, useEffect, useRef } from 'react';

import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { translationApiRef } from '@backstage/core-plugin-api/alpha';

import { attachPseudolocalizationIfEnabled } from '../apis/pseudolocalization';
import type { I18nextTranslationApi } from '../apis/I18nextTranslationApi';

/**
 * Provider component that enables pseudo-localization when activated via
 * URL query parameter (`?pseudolocalization=true`) or app-config
 * (`i18n.pseudolocalization.enabled: true`).
 *
 * Register as a dynamic plugin at the `application/provider` mount point.
 *
 * @public
 */
export const PseudoLocalizationProvider = ({
  children,
}: PropsWithChildren<{}>) => {
  const configApi = useApi(configApiRef);
  const translationApi = useApi(translationApiRef);
  const attached = useRef(false);

  useEffect(() => {
    if (attached.current) {
      return;
    }
    attached.current = true;
    attachPseudolocalizationIfEnabled(
      translationApi as unknown as I18nextTranslationApi,
      configApi,
    );
  }, [translationApi, configApi]);

  return <>{children}</>;
};
