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

import { isValidElement } from 'react';

import { useApp } from '@backstage/core-plugin-api';

import MuiIcon from '@mui/material/Icon';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { getImageForIconClass } from '../../utils/icons';

export interface InstructionIconProps {
  icon?: string;
  text: string;
}

/**
 * Icon component for instruction steps that supports multiple icon formats:
 * - Backstage system icons (e.g., 'kind:component', 'kind:api')
 * - Material Design icons (e.g., 'settings', 'home', 'build')
 * - SVG strings (e.g., '<svg xmlns="http://www.w3.org/2000/svg">...</svg>')
 * - URLs (e.g., 'https://example.com/icon.png', '/assets/icon.svg')
 * - Data URIs (e.g., 'data:image/svg+xml;base64,...')
 * - Legacy built-in icons (e.g., 'approval-tool', 'choose-repositories')
 */
export const InstructionIcon = ({ icon, text }: InstructionIconProps) => {
  const app = useApp();
  const theme = useTheme();

  // Common wrapper for consistent layout
  const IconWrapper = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '140px',
      }}
    >
      <div
        style={{
          height: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '8px',
        }}
      >
        {children}
      </div>
      <Typography
        style={{
          maxWidth: '150px',
          textAlign: 'center',
          lineHeight: '1.2',
        }}
      >
        {text}
      </Typography>
    </div>
  );

  // If no icon is provided, show only text with consistent spacing
  if (!icon) {
    return (
      <IconWrapper>
        <div style={{ height: '80px', width: '80px' }} />
      </IconWrapper>
    );
  }

  // Handle React elements (though not expected from config)
  if (isValidElement(icon)) {
    return <IconWrapper>{icon}</IconWrapper>;
  }

  const strIcon = icon as string;

  // Ensure we have a valid string
  if (typeof strIcon !== 'string') {
    return (
      <IconWrapper>
        <div style={{ height: '80px', width: '80px' }} />
      </IconWrapper>
    );
  }

  // Try Backstage system icons first
  const SystemIcon = app.getSystemIcon(strIcon);
  if (SystemIcon) {
    return (
      <IconWrapper>
        <div
          style={{
            fontSize: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SystemIcon />
        </div>
      </IconWrapper>
    );
  }

  // Handle SVG strings
  if (strIcon.startsWith('<svg')) {
    const svgDataUri = `data:image/svg+xml;base64,${btoa(strIcon)}`;
    return (
      <IconWrapper>
        <img
          src={svgDataUri}
          alt={text}
          style={{
            height: '80px',
            width: '80px',
            objectFit: 'contain',
          }}
        />
      </IconWrapper>
    );
  }

  // Handle URLs and data URIs
  if (
    strIcon.startsWith('https://') ||
    strIcon.startsWith('http://') ||
    strIcon.startsWith('/') ||
    strIcon.startsWith('data:image/')
  ) {
    return (
      <IconWrapper>
        <img
          src={strIcon}
          alt={text}
          style={{
            height: '80px',
            width: '80px',
            objectFit: 'contain',
          }}
        />
      </IconWrapper>
    );
  }

  // Check for legacy built-in icons (backward compatibility)
  const legacyIcons = [
    'approval-tool',
    'choose-repositories',
    'generate-cataloginfo',
    'edit-pullrequest',
    'track-status',
  ];

  if (legacyIcons.includes(strIcon)) {
    // Use theme-aware legacy icons
    const iconClassname =
      theme.palette.mode === 'dark'
        ? `icon-${strIcon}-white`
        : `icon-${strIcon}-black`;

    return (
      <IconWrapper>
        <img
          src={getImageForIconClass(iconClassname)}
          alt={text}
          style={{
            height: '80px',
            width: '80px',
            objectFit: 'contain',
          }}
        />
      </IconWrapper>
    );
  }

  // Fallback: treat as Material Design icon name
  return (
    <IconWrapper>
      <MuiIcon
        baseClassName="material-icons-outlined"
        sx={{ fontSize: '80px' }}
      >
        {strIcon}
      </MuiIcon>
    </IconWrapper>
  );
};
