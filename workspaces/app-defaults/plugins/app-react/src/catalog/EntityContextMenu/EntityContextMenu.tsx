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

// Based on https://github.com/backstage/backstage/blob/v1.54.6/plugins/catalog/src/alpha/components/EntityContextMenu/EntityContextMenu.tsx
// Fallback items cover a Backstage gap: EntityLayoutBui does not forward
// contextMenuItems into custom EntityHeaderLayoutBlueprint components, so the
// localized header would otherwise open an empty Menu ("No results found.").

import { type ComponentProps, useEffect, useRef } from 'react';
import {
  type AppNode,
  ExtensionBoundary,
  IconComponent,
  dialogApiRef,
  useTranslationRef,
} from '@backstage/frontend-plugin-api';
import { alertApiRef, useApi, useRouteRef } from '@backstage/core-plugin-api';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import { catalogTranslationRef } from '@backstage/plugin-catalog';
import { catalogEntityDeletePermission } from '@backstage/plugin-catalog-common/alpha';
import {
  UnregisterEntityDialog,
  useEntity,
} from '@backstage/plugin-catalog-react';
import {
  useEntityPermission,
  type EntityContextMenuItemData,
} from '@backstage/plugin-catalog-react/alpha';
import {
  ButtonIcon,
  Menu,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from '@backstage/ui';
import {
  RiBugLine,
  RiDeleteBinLine,
  RiFileCopyLine,
  RiMore2Line,
} from '@remixicon/react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import useCopyToClipboard from 'react-use/esm/useCopyToClipboard';

/**
 * `EntityContextMenuItemDataWithNode` copy from `@backstage/plugin-catalog`, because its not exported.
 * @alpha
 */
export type EntityContextMenuItemDataWithNode = {
  data: EntityContextMenuItemData;
  node: AppNode;
};

function EntityContextMenuItemContent(props: {
  data: EntityContextMenuItemData;
}) {
  const { icon, useProps } = props.data;
  const { title, disabled, onClick, ...menuItemProps } = useProps();
  const onAction = onClick
    ? () => {
        const result = onClick();
        if (result) {
          // Prevent rejected async actions from becoming unhandled rejections.
          void result.catch(() => {});
        }
      }
    : undefined;

  if ('href' in menuItemProps) {
    return (
      <MenuItem
        iconStart={icon}
        href={menuItemProps.href}
        onAction={onAction}
        isDisabled={disabled}
      >
        {title}
      </MenuItem>
    );
  }

  return (
    <MenuItem iconStart={icon} onAction={onAction} isDisabled={disabled}>
      {title}
    </MenuItem>
  );
}

function EntityContextMenuItem(props: {
  item: EntityContextMenuItemDataWithNode;
}) {
  return (
    <ExtensionBoundary node={props.item.node} errorPresentation="error-api">
      <EntityContextMenuItemContent data={props.item.data} />
    </ExtensionBoundary>
  );
}

function UnregisterEntityDialogWithCloseOnRouteChange(
  props: ComponentProps<typeof UnregisterEntityDialog>,
) {
  const { pathname } = useLocation();
  const initialPathname = useRef(pathname);
  const { onClose } = props;

  useEffect(() => {
    if (pathname !== initialPathname.current) {
      onClose();
    }
  }, [pathname, onClose]);

  return <UnregisterEntityDialog {...props} />;
}

/**
 * Stock catalog actions used when EntityLayoutBui omits contextMenuItems for a
 * custom header layout (LocalizedEntityHeaderLayout).
 */
function DefaultEntityContextMenuItems() {
  const { entity } = useEntity();
  const { t } = useTranslationRef(catalogTranslationRef);
  const alertApi = useApi(alertApiRef);
  const dialogApi = useApi(dialogApiRef);
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const [copyState, copyToClipboard] = useCopyToClipboard();
  const catalogIndexRoute = useRouteRef(catalogPlugin.routes.catalogIndex);
  const unregisterRedirectRoute = useRouteRef(
    catalogPlugin.externalRoutes.unregisterRedirect,
  );
  const unregisterPermission = useEntityPermission(
    catalogEntityDeletePermission,
  );

  useEffect(() => {
    if (!copyState.error && copyState.value) {
      alertApi.post({
        message: t('entityContextMenu.copiedMessage'),
        severity: 'info',
        display: 'transient',
      });
    }
  }, [copyState, alertApi, t]);

  return (
    <>
      <MenuItem
        iconStart={<RiDeleteBinLine size={16} />}
        isDisabled={!unregisterPermission.allowed}
        onAction={() => {
          dialogApi.open(({ dialog }) => (
            <UnregisterEntityDialogWithCloseOnRouteChange
              open
              entity={entity}
              onClose={() => dialog.close()}
              onConfirm={() => {
                dialog.close();
                navigate(
                  unregisterRedirectRoute
                    ? unregisterRedirectRoute()
                    : catalogIndexRoute(),
                );
              }}
            />
          ));
        }}
      >
        {t('entityContextMenu.unregisterMenuTitle')}
      </MenuItem>
      <MenuItem
        iconStart={<RiBugLine size={16} />}
        onAction={() => {
          setSearchParams('inspect');
        }}
      >
        {t('entityContextMenu.inspectMenuTitle')}
      </MenuItem>
      <MenuItem
        iconStart={<RiFileCopyLine size={16} />}
        onAction={() => {
          copyToClipboard(window.location.toString());
        }}
      >
        {t('entityContextMenu.copyURLMenuTitle')}
      </MenuItem>
    </>
  );
}

/**
 * `EntityContextMenu` copy from `@backstage/plugin-catalog`, because its not exported.
 * @alpha
 */
export function EntityContextMenu(props: {
  UNSTABLE_extraContextMenuItems?: {
    title: string;
    Icon: IconComponent;
    onClick: () => void;
  }[];
  contextMenuItems?: EntityContextMenuItemDataWithNode[];
}) {
  const { UNSTABLE_extraContextMenuItems, contextMenuItems } = props;
  const { t } = useTranslationRef(catalogTranslationRef);

  const hasExtensionItems = Boolean(contextMenuItems?.length);
  const hasExtraItems = Boolean(UNSTABLE_extraContextMenuItems?.length);
  const useDefaultItems = !hasExtensionItems && !hasExtraItems;

  return (
    <MenuTrigger>
      <ButtonIcon
        variant="secondary"
        icon={<RiMore2Line />}
        aria-label={t('entityContextMenu.moreButtonAriaLabel')}
      />
      <Menu placement="bottom end">
        {UNSTABLE_extraContextMenuItems?.map((item, index) => (
          <MenuItem
            key={`${item.title}-${index}`}
            iconStart={<item.Icon />}
            onAction={() => item.onClick()}
          >
            {item.title}
          </MenuItem>
        ))}
        {hasExtraItems && hasExtensionItems ? <MenuSeparator /> : null}
        {contextMenuItems?.map(item => (
          <EntityContextMenuItem key={item.node.spec.id} item={item} />
        ))}
        {useDefaultItems ? <DefaultEntityContextMenuItems /> : null}
      </Menu>
    </MenuTrigger>
  );
}
