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

import { lazy, Suspense, type ComponentType } from 'react';

import type { GlobalHeaderComponentData } from '@red-hat-developer-hub/backstage-plugin-app-react';

import {
  loadCriticalHeaderBundle,
  loadHeaderIconButton,
} from '../components/loaders';

const LazyHeaderIconButton = lazy(() =>
  loadHeaderIconButton().then(HeaderIconButton => ({
    default: HeaderIconButton,
  })),
);

/**
 * Turns data-driven toolbar contributions (icon/title/link without a custom
 * component) into renderable components for the masthead.
 */
export function resolveDataDrivenComponents(
  items: GlobalHeaderComponentData[],
): GlobalHeaderComponentData[] {
  return items.map(item => {
    if (item.component) {
      return item;
    }

    const component = createDataDrivenToolbarComponent(item);
    return { ...item, component };
  });
}

function createDataDrivenToolbarComponent(
  params: GlobalHeaderComponentData,
): ComponentType<any> {
  if (params.link) {
    const ConfigComponent = () => (
      <Suspense fallback={null}>
        <LazyHeaderIconButton
          title={params.title ?? ''}
          titleKey={params.titleKey}
          icon={params.icon ?? ''}
          tooltip={params.tooltip}
          to={params.link!}
        />
      </Suspense>
    );
    return ConfigComponent;
  }

  const OnClickComponent = lazy(async () => {
    const [
      { default: IconButton },
      { default: Tooltip },
      criticalHeaderBundle,
      { useTranslation },
      { translateWithFallback },
    ] = await Promise.all([
      import('@mui/material/IconButton'),
      import('@mui/material/Tooltip'),
      loadCriticalHeaderBundle(),
      import('../hooks/useTranslation'),
      import('./translationUtils'),
    ]);

    const { HeaderIcon } = criticalHeaderBundle;

    return {
      default: function DataDrivenOnClickToolbarButton() {
        const { t } = useTranslation();
        const displayTitle = translateWithFallback(
          t,
          params.titleKey,
          params.title,
        );
        return (
          <Tooltip title={params.tooltip ?? displayTitle ?? ''}>
            <IconButton
              onClick={params.onClick}
              color="inherit"
              size="small"
              aria-label={displayTitle ?? ''}
            >
              {params.icon && <HeaderIcon icon={params.icon} size="small" />}
            </IconButton>
          </Tooltip>
        );
      },
    };
  });

  return () => (
    <Suspense fallback={null}>
      <OnClickComponent />
    </Suspense>
  );
}
