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

import { useTranslationRef } from '@backstage/frontend-plugin-api';
import { Container } from '@backstage/ui';
import { NotFoundPage } from '@red-hat-developer-hub/backstage-plugin-app-react';

import { appDefaultsTranslationRef } from '../translations/ref';

/**
 * Localized not-found page that provides translated title and description
 * to the shared `NotFoundPage` component from app-react.
 *
 * @internal
 */
export function CustomNotFoundPage() {
  const { t } = useTranslationRef(appDefaultsTranslationRef);
  return (
    <Container my="4">
      <NotFoundPage
        title={t('notFound.title')}
        description={t('notFound.description')}
      />
    </Container>
  );
}
