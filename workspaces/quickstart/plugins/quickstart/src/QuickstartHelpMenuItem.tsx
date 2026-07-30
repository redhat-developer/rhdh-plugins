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

import { useAppDrawer } from '@red-hat-developer-hub/backstage-plugin-app-react';
import { GlobalHeaderMenuItem } from '@red-hat-developer-hub/backstage-plugin-global-header/alpha';

import { QUICKSTART_DRAWER_ID } from './const';

export const QuickstartHelpMenuItem = ({
  handleClose,
}: {
  handleClose?: () => void;
}) => {
  const { toggleDrawer } = useAppDrawer();

  const handleClick = () => {
    toggleDrawer(QUICKSTART_DRAWER_ID);
    handleClose?.();
  };

  return (
    <GlobalHeaderMenuItem
      title="Quick start"
      icon="waving_hand"
      onClick={handleClick}
    />
  );
};
