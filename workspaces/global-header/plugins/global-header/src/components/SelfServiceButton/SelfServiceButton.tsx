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

import { HeaderIconButton } from '../HeaderIconButton/HeaderIconButton';
import { useIsScaffolderAvailable } from '../../hooks/useIsScaffolderAvailable';

export interface SelfServiceButtonProps {
  title?: string;
  titleKey?: string;
  icon?: string;
  tooltip?: string;
  to?: string;
}

export const SelfServiceButton = ({
  title = 'Self-service',
  titleKey,
  icon = 'add',
  tooltip,
  to = '/create',
}: SelfServiceButtonProps) => {
  const isAvailable = useIsScaffolderAvailable();
  if (!isAvailable) {
    return null;
  }

  const resolvedTitleKey =
    titleKey ?? (title === 'Self-service' ? 'create.title' : undefined);

  return (
    <HeaderIconButton
      title={title}
      titleKey={resolvedTitleKey}
      icon={icon}
      tooltip={tooltip}
      to={to}
    />
  );
};
