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
import { useMemo } from 'react';
import { useResolvedPath } from 'react-router-dom';
import {
  BreadcrumbEntry,
  type PageLayoutProps,
  useBreadcrumbEntries,
  useTranslationRef,
} from '@backstage/frontend-plugin-api';
import { type HeaderTab, PluginHeader } from '@backstage/ui';
import { appReactTranslationRef } from '@red-hat-developer-hub/backstage-plugin-app-react';

type TranslateFn = (key: string, options: { defaultValue: string }) => string;

function translateTitle(
  t: TranslateFn,
  namespaces: readonly ('pages' | 'pageTabs')[],
  title: string,
): string {
  // i18next uses `.` as its key separator, so any dot in the title is replaced
  // with `_` to keep the whole title as a single key.
  const key = title.replaceAll('.', '_');
  return namespaces.reduceRight(
    (defaultValue, namespace) => t(`${namespace}.${key}`, { defaultValue }),
    title,
  );
}

/**
 * Renders the plugin header with localized breadcrumbs. Kept as a child of
 * {@link BreadcrumbEntry} so it can read the registry after the current page
 * has registered, without the page layout itself subscribing to registry
 * updates while also registering (which re-entrancy can amplify into an
 * update loop together with header resize/truncation effects).
 */
function LocalizedPluginHeader(
  props: Omit<PageLayoutProps, 'children' | 'noHeader' | 'tabs'> & {
    tabs?: HeaderTab[];
  },
) {
  const { title, icon, titleLink, headerActions, tabs } = props;
  const { t } = useTranslationRef(appReactTranslationRef);
  const translate = t as unknown as TranslateFn;
  const { items } = useBreadcrumbEntries();

  // Breadcrumb labels may be page titles or tab titles, so try both namespaces.
  // When the registry only contains the current page (no ancestors), keep
  // breadcrumbs unset so PluginHeader shows the translated title as an <h1>.
  // Passing a single self-entry would flip the header from title → breadcrumbs
  // right after BreadcrumbEntry mounts, which can re-enter layout/truncation
  // updates and blow the React update depth limit.
  const breadcrumbs =
    items.length > 1
      ? items.map(({ href, label }) => ({
          href,
          label: translateTitle(translate, ['pages', 'pageTabs'], label),
        }))
      : undefined;

  return (
    <PluginHeader
      title={title}
      icon={icon}
      titleLink={titleLink}
      breadcrumbs={breadcrumbs}
      tabs={tabs}
      customActions={headerActions}
    />
  );
}

/**
 * Page layout that renders the Backstage `PluginHeader` with a localized
 * title, tab labels and breadcrumbs. It mirrors the default `core-page-layout`
 * of `@backstage/plugin-app` (tab href resolution, breadcrumb entry), which
 * receives plain English strings from `PageBlueprint` / `SubPageBlueprint`.
 *
 * The page title is looked up under `pages.<title>` (shared with the sidebar)
 * and tab labels under `pageTabs.<title>`; breadcrumbs are made of both, so
 * they are looked up in both namespaces. Unknown titles fall back to the
 * original English label.
 */
export function LocalizedPageLayout(props: PageLayoutProps) {
  const { title, icon, noHeader, titleLink, headerActions, tabs, children } =
    props;
  const { t } = useTranslationRef(appReactTranslationRef);
  const translate = t as unknown as TranslateFn;

  const parentPath = useResolvedPath('.').pathname.replace(/\/$/, '');
  const resolvedTabs = useMemo<HeaderTab[] | undefined>(
    () =>
      tabs?.map(tab => ({
        ...tab,
        label: translateTitle(translate, ['pageTabs'], tab.label),
        href: tab.href.startsWith('/')
          ? tab.href
          : `${parentPath}/${tab.href}`.replace(/\/{2,}/g, '/'),
        matchStrategy: 'prefix',
      })),
    [tabs, parentPath, translate],
  );

  if (noHeader) {
    return <>{children}</>;
  }

  const content = (
    <>
      <LocalizedPluginHeader
        title={title ? translateTitle(translate, ['pages'], title) : title}
        icon={icon}
        titleLink={titleLink}
        headerActions={headerActions}
        tabs={resolvedTabs}
      />
      {children}
    </>
  );

  if (!title) {
    return content;
  }

  // The breadcrumb entry keeps the English title: it is localized when the
  // entries are rendered (see LocalizedPluginHeader), so a page nested below
  // this one can still resolve the translation from the original label.
  return (
    <BreadcrumbEntry
      entry={{ label: title, href: titleLink ?? (parentPath || '/') }}
    >
      {content}
    </BreadcrumbEntry>
  );
}
