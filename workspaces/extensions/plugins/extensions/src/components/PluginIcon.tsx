/*
 * Copyright The Backstage Authors
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

import CardMedia from '@mui/material/CardMedia';
import NoIconIcon from '@mui/icons-material/PowerOutlined';

import { ExtensionsPlugin } from '@red-hat-developer-hub/backstage-plugin-extensions-common';

export const PluginIcon = ({
  plugin,
  size,
}: {
  plugin: ExtensionsPlugin;
  size: number;
}) => {
  const icon = plugin?.spec?.icon;

  if (!icon) {
    return (
      <CardMedia
        sx={{
          width: size,
          height: size,
          flexShrink: 0,
          backgroundColor: 'action.disabledBackground',
        }}
      >
        <NoIconIcon
          sx={{
            width: size,
            height: size,
            padding: '10px',
            color: 'action.disabled',
          }}
        />
      </CardMedia>
    );
  }

  return (
    <CardMedia
      image={icon}
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
      }}
    />
  );
};
