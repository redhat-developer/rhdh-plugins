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
import React from 'react';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import StarOutlineOutlinedIcon from '@mui/icons-material/StarOutlineOutlined';
import { createDevApp } from '@backstage/dev-utils';
import { getAllThemes } from '@red-hat-developer-hub/backstage-plugin-theme';
import {
  sandboxPlugin,
  SandboxPage,
  SandboxActivitiesPage,
} from '../src/plugin';

createDevApp()
  .registerPlugin(sandboxPlugin)
  .addThemes(getAllThemes())
  .addPage({
    element: <SandboxPage />,
    title: 'Home',
    icon: HomeOutlinedIcon,
    path: '/',
  })
  .addPage({
    element: <SandboxActivitiesPage />,
    title: 'Activities',
    icon: StarOutlineOutlinedIcon,
    path: '/activities',
  })
  .render();
