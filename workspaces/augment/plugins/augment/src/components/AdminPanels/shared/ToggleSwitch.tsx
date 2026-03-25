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

import { useCallback, type ChangeEvent, type InputHTMLAttributes } from 'react';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material/styles';

/**
 * onChange matches MUI Switch's signature so existing consumers that
 * destructure `(event, checked)` keep working.
 */
interface ToggleSwitchProps {
  readonly checked: boolean;
  readonly onChange: (
    event: ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) => void;
  readonly disabled?: boolean;
  readonly sx?: SxProps<Theme>;
  readonly inputProps?: InputHTMLAttributes<HTMLInputElement>;
}

const TRACK_W = 36;
const TRACK_H = 20;
const THUMB_SIZE = 16;
const THUMB_OFFSET = 2;
const TRAVEL = TRACK_W - THUMB_SIZE - THUMB_OFFSET * 2;

/**
 * MUI FormControlLabel applies `marginLeft: -11px` to the control
 * (intended for MUI Switch/Checkbox whose internal padding absorbs it).
 * This left margin on the root cancels it, preventing clipping of the
 * unchecked thumb inside `overflow: hidden` ancestors.
 */
const FCL_MARGIN = 11;

/**
 * Self-contained toggle switch that renders identically in any
 * Backstage theme.  Built from plain DOM elements to side-step CSS
 * specificity conflicts with MUI Switch's internal emotion styles.
 *
 * A hidden native checkbox covers the full toggle area for click
 * handling, keyboard focus, form semantics, and screen-reader support.
 */
export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  sx,
  inputProps,
}: ToggleSwitchProps) {
  const theme = useTheme();

  let trackBg: string;
  if (checked) {
    trackBg = theme.palette.primary.main;
  } else if (theme.palette.mode === 'dark') {
    trackBg = 'rgba(255,255,255,0.3)';
  } else {
    trackBg = 'rgba(0,0,0,0.38)';
  }

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(e, e.target.checked);
    },
    [onChange],
  );

  return (
    <Box
      component="span"
      sx={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: TRACK_W,
        height: TRACK_H,
        marginLeft: `${FCL_MARGIN}px`,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        flexShrink: 0,
        verticalAlign: 'middle',
        ...((sx ?? {}) as Record<string, unknown>),
      }}
    >
      <Box
        component="input"
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        {...inputProps}
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          opacity: 0,
          margin: 0,
          padding: 0,
          cursor: 'inherit',
          zIndex: 1,
        }}
      />

      {/* Track */}
      <Box
        component="span"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: TRACK_W,
          height: TRACK_H,
          borderRadius: `${TRACK_H / 2}px`,
          backgroundColor: trackBg,
          transition: 'background-color 200ms ease',
        }}
      />

      {/* Thumb */}
      <Box
        component="span"
        sx={{
          position: 'absolute',
          top: THUMB_OFFSET,
          left: THUMB_OFFSET,
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          borderRadius: '50%',
          backgroundColor: '#fff',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.3)',
          transform: checked ? `translateX(${TRAVEL}px)` : 'translateX(0)',
          transition: 'transform 200ms ease',
        }}
      />
    </Box>
  );
}
