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
import type { ComponentType } from 'react';
import { MenuSection } from './MenuSection';
import { MenuItemLink } from '../MenuItemLink/MenuItemLink';
import { useTranslation } from '../../hooks/useTranslation';

/**
 * Register A Component Section properties
 *
 * @public
 */
export type RegisterAComponentSectionProps = {
  hideDivider: boolean;
  handleClose: () => void;
};

export const RegisterAComponentSection = ({
  hideDivider,
  handleClose,
}: RegisterAComponentSectionProps) => {
  const { t } = useTranslation();

  return (
    <MenuSection
      hideDivider={hideDivider}
      items={[
        {
          label: t('create.registerComponent.title'),
          subLabel: t('create.registerComponent.subtitle'),
          link: '/catalog-import',
          icon: 'category',
          Component: MenuItemLink as ComponentType,
        },
      ]}
      handleClose={handleClose}
    />
  );
};
