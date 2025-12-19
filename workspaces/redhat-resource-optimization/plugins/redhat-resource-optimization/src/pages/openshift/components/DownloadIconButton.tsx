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

import Typography from '@material-ui/core/Typography';
import React from 'react';

type DownloadIconButtonProps = {
  label: string;
  variant: 'gray' | 'black' | 'white';
  onClick?: () => void;
  disabled?: boolean;
};

const getColor = (variant: 'gray' | 'black' | 'white', disabled?: boolean) => {
  if (disabled) return '#999999';
  if (variant === 'gray') return '#C7C7C7';
  if (variant === 'black') return '#000000';
  if (variant === 'white') return '#FFFFFF';
  return '#C7C7C7';
};

export function DownloadIconButton(props: Readonly<DownloadIconButtonProps>) {
  const { label, variant, onClick, disabled } = props;
  const color = getColor(variant, disabled);

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : onClick}
      onKeyDown={
        disabled
          ? undefined
          : e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
      }
      style={{
        border: `2px solid ${color}`,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        paddingTop: 2,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Typography
        variant="body2"
        style={{ color, fontSize: 9, fontWeight: 'bold' }}
      >
        {label}
      </Typography>
    </div>
  );
}
