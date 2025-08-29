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

import { useEffect, useMemo, useRef } from 'react';
import type { ComponentType, CSSProperties } from 'react';
import { HeaderDropdownComponent } from './HeaderDropdownComponent';
import { useDropdownManager } from '../../hooks';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useHelpDropdownMountPoints } from '../../hooks/useHelpDropdownMountPoints';
import { MenuSection } from './MenuSection';
import { DropdownEmptyState } from './DropdownEmptyState';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { useValidComponentTracker } from '../../hooks/useValidComponentTracker';
import { useTranslation } from '../../hooks/useTranslation';

/**
 * @public
 */
export interface HelpDropdownProps {
  layout?: CSSProperties;
}

const ValidityTracker = ({
  Component,
  props,
  componentId,
  onValidityChange,
}: {
  Component: ComponentType<any>;
  props: any;
  componentId: string;
  onValidityChange: (componentId: string, isValid: boolean) => void;
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkContent = () => {
      if (!contentRef.current) return;

      const element = contentRef.current;
      const hasText = (element.textContent?.trim().length ?? 0) > 0;
      const hasChildren = element.children.length > 0;
      const hasChildNodes = element.childNodes.length > 0;

      // A component is valid if it renders ANY content at all
      const componentIsValid = hasText || hasChildren || hasChildNodes;

      onValidityChange(componentId, componentIsValid);
    };

    // Check after component has had time to render (longer timeout for lazy components)
    const timer1 = setTimeout(checkContent, 500);
    const timer2 = setTimeout(checkContent, 1500); // Double check later

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [componentId, onValidityChange]);

  try {
    return (
      <div ref={contentRef}>
        <Component {...props} />
      </div>
    );
  } catch (error) {
    onValidityChange(componentId, false);
    return null;
  }
};

export const HelpDropdown = ({ layout }: HelpDropdownProps) => {
  const { anchorEl, handleOpen, handleClose } = useDropdownManager();
  const helpDropdownMountPoints = useHelpDropdownMountPoints();
  const { t } = useTranslation();

  const { shouldShowEmpty, updateComponentValidity } = useValidComponentTracker(
    helpDropdownMountPoints?.length ?? 0,
  );

  // Create all mount point items with validity tracking
  const allMenuItems = useMemo(() => {
    return (helpDropdownMountPoints ?? [])
      .map((mp, index) => {
        const componentId = `${mp.config?.props?.title || 'helpItem'}-${
          mp.config?.priority || 0
        }-${index}`;

        return {
          componentId,
          Component: () => (
            <ValidityTracker
              Component={mp.Component}
              props={mp.config?.props || {}}
              componentId={componentId}
              onValidityChange={updateComponentValidity}
            />
          ),
          icon: mp.config?.props?.icon,
          label: mp.config?.props?.title,
          link: mp.config?.props?.link,
          tooltip: mp.config?.props?.tooltip,
          style: mp.config?.style,
          priority: mp.config?.priority ?? 0,
        };
      })
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }, [helpDropdownMountPoints, updateComponentValidity]);

  const menuItems = allMenuItems;

  return (
    <HeaderDropdownComponent
      isIconButton
      tooltip={t('help.tooltip')}
      buttonContent={<HelpOutlineIcon />}
      buttonProps={{
        color: 'inherit',
        sx: layout,
      }}
      onOpen={handleOpen}
      onClose={handleClose}
      anchorEl={anchorEl}
    >
      {!shouldShowEmpty ? (
        <MenuSection hideDivider items={menuItems} handleClose={handleClose} />
      ) : (
        <DropdownEmptyState
          title={t('help.noSupportLinks')}
          subTitle={t('help.noSupportLinksSubtitle')}
          icon={
            <SupportAgentIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
          }
        />
      )}
    </HeaderDropdownComponent>
  );
};
