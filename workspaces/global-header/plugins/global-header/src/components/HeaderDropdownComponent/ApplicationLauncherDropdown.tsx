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

import AppsIcon from '@mui/icons-material/Apps';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';

import { useApplicationLauncherDropdownMountPoints } from '../../hooks/useApplicationLauncherDropdownMountPoints';
import { useDropdownManager } from '../../hooks';
import { HeaderDropdownComponent } from './HeaderDropdownComponent';
import { MenuSection } from './MenuSection';
import { DropdownEmptyState } from './DropdownEmptyState';
import { useTranslation } from '../../hooks/useTranslation';

export const ApplicationLauncherDropdown = () => {
  const { anchorEl, handleOpen, handleClose } = useDropdownManager();
  const { t } = useTranslation();

  const mountPoints = useApplicationLauncherDropdownMountPoints();

  const sectionsObject = useMemo(() => {
    const groupedSections: Record<
      string,
      { sectionLink?: string; sectionLinkLabel?: string; items: any[] }
    > = {};

    (mountPoints ?? []).forEach(mp => {
      const section = mp.config?.section ?? '';
      const sectionLink = mp.config?.sectionLink ?? '';
      const sectionLinkLabel = mp.config?.sectionLinkLabel ?? '';

      if (!groupedSections[section]) {
        groupedSections[section] = { sectionLink, sectionLinkLabel, items: [] };
      }
      groupedSections[section].items.push({
        Component: mp.Component,
        icon: mp.config?.props?.icon,
        label: mp.config?.props?.title,
        labelKey: mp.config?.props?.titleKey,
        link: mp.config?.props?.link,
        external: mp.config?.props?.external ?? false,
        priority: mp.config?.priority ?? 0,
      });
    });

    Object.values(groupedSections).forEach(section => {
      section.items.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    });

    return groupedSections;
  }, [mountPoints]);

  const sections = Object.entries(sectionsObject);

  return (
    <HeaderDropdownComponent
      buttonContent={<AppsIcon />}
      tooltip={t('applicationLauncher.tooltip')}
      isIconButton
      onOpen={handleOpen}
      onClose={handleClose}
      anchorEl={anchorEl}
    >
      {sections.length > 0 ? (
        sections.map(
          ([section, { sectionLink, sectionLinkLabel, items }], index) => (
            <MenuSection
              key={section}
              sectionLabel={section}
              optionalLink={sectionLink}
              optionalLinkLabel={sectionLinkLabel}
              items={items}
              handleClose={handleClose}
              hideDivider={index === sections.length - 1}
            />
          ),
        )
      ) : (
        <DropdownEmptyState
          title={t('applicationLauncher.noLinksTitle')}
          subTitle={t('applicationLauncher.noLinksSubtitle')}
          icon={
            <AppRegistrationIcon
              sx={{ fontSize: 64, color: 'text.disabled' }}
            />
          }
        />
      )}
    </HeaderDropdownComponent>
  );
};
