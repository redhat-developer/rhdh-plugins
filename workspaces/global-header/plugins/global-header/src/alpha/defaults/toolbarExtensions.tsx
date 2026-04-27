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

/**
 * Default toolbar component extensions (`gh-component`) for the global header.
 *
 * @internal
 */

import { GlobalHeaderComponentBlueprint } from '../extensions/blueprints';

import { SearchComponent } from '../../components/SearchComponent/SearchComponent';
import { Spacer } from '../../components/Spacer/Spacer';
import { StarredDropdown } from '../../components/HeaderDropdownComponent/StarredDropdown';
import { NotificationButton } from '../../components/NotificationButton/NotificationButton';
import { Divider } from '../../components/Divider/Divider';
import { CompanyLogo } from '../../components/CompanyLogo/CompanyLogo';
import { HeaderIconButton } from '../../components/HeaderIconButton/HeaderIconButton';
import { ProfileDropdown } from '../components/ProfileDropdown';
import { HelpDropdown } from '../components/HelpDropdown';
import { ApplicationLauncherDropdown } from '../components/ApplicationLauncherDropdown';
import { rhdhLogo } from './rhdhLogo';

const CompanyLogoWrapper = () => <CompanyLogo to="/" logo={rhdhLogo} />;

const SelfServiceButton = () => (
  <HeaderIconButton
    title="Self-service"
    titleKey="create.title"
    icon="addCircleOutline"
    to="/create"
  />
);

/** @alpha */
export const companyLogoExtension = GlobalHeaderComponentBlueprint.make({
  name: 'company-logo',
  params: { component: CompanyLogoWrapper, priority: 200 },
});

/** @alpha */
export const searchExtension = GlobalHeaderComponentBlueprint.make({
  name: 'search',
  params: {
    component: SearchComponent,
    priority: 100,
    layout: { flexGrow: 1 },
  },
});

/** @alpha */
export const spacerExtension = GlobalHeaderComponentBlueprint.make({
  name: 'spacer',
  params: { component: Spacer, priority: 99, layout: { flexGrow: 0 } },
});

/** @alpha */
export const selfServiceButtonExtension = GlobalHeaderComponentBlueprint.make({
  name: 'self-service-button',
  params: {
    component: SelfServiceButton,
    priority: 90,
  },
});

/** @alpha */
export const starredDropdownExtension = GlobalHeaderComponentBlueprint.make({
  name: 'starred-dropdown',
  params: { component: StarredDropdown, priority: 85 },
});

/** @alpha */
export const applicationLauncherDropdownExtension =
  GlobalHeaderComponentBlueprint.make({
    name: 'app-launcher-dropdown',
    params: { component: ApplicationLauncherDropdown, priority: 82 },
  });

/** @alpha */
export const helpDropdownExtension = GlobalHeaderComponentBlueprint.make({
  name: 'help-dropdown',
  params: { component: HelpDropdown, priority: 80 },
});

/** @alpha */
export const notificationButtonExtension = GlobalHeaderComponentBlueprint.make({
  name: 'notification-button',
  params: { component: NotificationButton, priority: 70 },
});

/** @alpha */
export const dividerExtension = GlobalHeaderComponentBlueprint.make({
  name: 'divider',
  params: { component: Divider, priority: 50 },
});

/** @alpha */
export const profileDropdownExtension = GlobalHeaderComponentBlueprint.make({
  name: 'profile-dropdown',
  params: { component: ProfileDropdown, priority: 10 },
});
