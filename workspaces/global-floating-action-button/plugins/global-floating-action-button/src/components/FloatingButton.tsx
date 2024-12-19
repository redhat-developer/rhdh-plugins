/*
 * Copyright 2024 The Backstage Authors
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

// how many sub-menu items do we support ?

import * as React from 'react';
import classnames from 'classnames';
import Fab from '@mui/material/Fab';
import { makeStyles, Typography } from '@material-ui/core';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import Tooltip from '@mui/material/Tooltip';
import Slide from '@mui/material/Slide';

type FloatingButtonAction = {
  // The floating button action will override these properties when there's only one action.
  icon: React.ReactElement;
  size?: 'small' | 'medium' | 'large' | string;
  position?: { top?: string; left?: string; right?: string; bottom?: string };
  hide?: boolean;
  color?:
    | 'default'
    | 'error'
    | 'info'
    | 'inherit'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | string;
  onClick?: React.MouseEventHandler;
  url?: string;
  label?: string | React.ReactNode;
  toolTip?: string;
  actions?: FloatingButtonAction[];
};

const useStyles = makeStyles(() => ({
  button: {
    zIndex: 200,
    display: 'flex',
    position: 'fixed',
    maxWidth: '150px',
    gap: '10px',
  },
}));

const fab = (
  icon: React.ReactElement,
  size: 'small' | 'medium' | 'large' | string,
  color?: any,
  label?: string | React.ReactNode,
  onClick?: any,
  url?: string,
  tooltip?: string,
) => {
  return (
    <Tooltip title={tooltip} placement="left">
      <div>
        <Fab
          id="add"
          variant={label ? 'extended' : 'circular'}
          size={(size as any) || 'medium'}
          color={(color as any) || 'default'}
          aria-label="add"
          onClick={onClick}
          href={url}
        >
          {icon}
          {label && (
            <Typography style={{ marginLeft: '2px' }}>{label}</Typography>
          )}
        </Fab>
      </div>
    </Tooltip>
  );
};

export const FloatingButton = ({
  floatingButton,
}: {
  floatingButton: FloatingButtonAction;
}) => {
  const theme = useTheme();
  const subMenuRef = React.useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [subMenuDirection, setSubMenuDirection] = React.useState('column');
  const fabButton = useStyles();

  React.useEffect(() => {
    const floatingButtonElement = document.getElementById('floating-button');
    const screenHeight = window.innerHeight;
    if (floatingButtonElement) {
      const { top } = floatingButtonElement?.getBoundingClientRect();
      if (top < screenHeight / 2) {
        setSubMenuDirection('column');
      } else {
        setSubMenuDirection('column-reverse');
      }
    }
  }, []);

  const handleClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  if (!floatingButton.icon || floatingButton.hide) {
    return null;
  }
  const position = floatingButton.position ||
    floatingButton.actions?.[0]?.position || { bottom: '60px', right: '60px' };
  const getFloatingButton = () => {
    if (
      (floatingButton.actions || []).length > 1 ||
      (floatingButton.actions || []).length === 0
    ) {
      return fab(
        (floatingButton.actions || []).length > 1 && isMenuOpen ? (
          <CloseIcon />
        ) : (
          floatingButton.icon
        ),
        floatingButton.size as string,
        floatingButton.color,
        floatingButton.label as string,
        floatingButton.actions?.length === 0
          ? floatingButton.onClick
          : handleClick,
        floatingButton.actions?.length === 0 ? floatingButton.url : undefined,
        floatingButton.toolTip,
      );
    }

    return fab(
      floatingButton.actions?.[0].icon as any,
      floatingButton.actions?.[0].size || 'medium',
      floatingButton.actions?.[0].color,
      floatingButton.actions?.[0].label,
      floatingButton.actions?.[0].onClick,
      floatingButton.actions?.[0].url,
      floatingButton.actions?.[0].toolTip,
    );
  };
  return (
    <div
      className={classnames(fabButton.button)}
      style={{
        flexDirection: (subMenuDirection as any) || 'column-reverse',
        top: position?.top,
        right: position?.right,
        left: position?.left,
        bottom: position?.bottom,
      }}
      id="floating-button"
      data-testId="floating-button"
      ref={subMenuRef}
    >
      {getFloatingButton()}
      {isMenuOpen && (
        <Slide
          container={subMenuRef.current}
          easing={{
            enter: theme.transitions.easing.easeOut,
            exit: theme.transitions.easing.sharp,
          }}
        >
          <>
            {floatingButton.actions?.map(fa => {
              return fab(
                fa.icon,
                floatingButton.size || 'medium',
                fa.color,
                fa.label,
                fa.onClick,
                fa.url,
                fa.toolTip,
              );
            })}
          </>
        </Slide>
      )}
    </div>
  );
};
