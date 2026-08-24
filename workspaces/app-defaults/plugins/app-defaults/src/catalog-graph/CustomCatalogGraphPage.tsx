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
import { ButtonLink } from '@backstage/ui';
import { translationRef } from '../translations/ref';
import { EmptyCatalogGate } from '../catalog/EmptyCatalogGate';

/**
 * @internal
 */
export function CustomCatalogGraphPage(props: { children: React.ReactNode }) {
  const { t } = useTranslationRef(translationRef);
  return (
    <EmptyCatalogGate
      emptyState={{
        title: t('catalogGraph.emptyState.title'),
        description: t('catalogGraph.emptyState.description'),
        action: (
          <ButtonLink href="/catalog" variant="primary">
            {t('catalogGraph.emptyState.action')}
          </ButtonLink>
        ),
      }}
    >
      {props.children}
    </EmptyCatalogGate>
  );
}
