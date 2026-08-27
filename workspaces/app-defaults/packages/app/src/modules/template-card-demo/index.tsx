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

import { createFrontendModule } from '@backstage/frontend-plugin-api';
import {
  TemplateCardActionBlueprint,
  TemplateCardBadgeBlueprint,
} from '@red-hat-developer-hub/backstage-plugin-app-react';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

const customChooseButton = TemplateCardActionBlueprint.make({
  name: 'demo-choose',
  params: {
    component: ({ onSelected, canCreateTask }) => {
      const tooltip = canCreateTask
        ? 'Create from this template'
        : 'You do not have permission to create';
      return (
        <Tooltip title={tooltip}>
          <span>
            <Button
              size="small"
              variant="outlined"
              color="primary"
              disabled={!canCreateTask}
              onClick={onSelected}
              startIcon={<RocketLaunchIcon />}
            >
              Launch
            </Button>
          </span>
        </Tooltip>
      );
    },
  },
});

const timeSavedBadge = TemplateCardBadgeBlueprint.make({
  name: 'demo-time-saved',
  params: {
    component: () => (
      <Chip
        size="small"
        icon={<AccessTimeOutlined />}
        label="Saves ~15 min"
        variant="filled"
      />
    ),
  },
});

export const templateCardDemoModule = createFrontendModule({
  pluginId: 'app',
  extensions: [customChooseButton, timeSavedBadge],
});
