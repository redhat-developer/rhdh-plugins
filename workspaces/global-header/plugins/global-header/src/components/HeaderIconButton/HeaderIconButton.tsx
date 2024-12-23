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

import React from 'react';
import IconButton from '@mui/material/IconButton';
import SmallIconWrapper, { IconComponentType } from './SmallIconWrapper';

interface HeaderIconButtonProps {
  Icon: IconComponentType;
  onClick: () => void;
}

export const HeaderIconButton: React.FC<HeaderIconButtonProps> = ({
  Icon,
  onClick,
}) => {
  return (
    <IconButton
      color="inherit"
      aria-label="help"
      sx={{ mr: 1.5 }}
      onClick={onClick}
    >
      <SmallIconWrapper IconComponent={Icon} />
    </IconButton>
  );
};
