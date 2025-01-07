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
import HeaderDropdownComponent from './HeaderDropdownComponent';
import ArrowDropDownOutlinedIcon from '@mui/icons-material/ArrowDropDownOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import { MenuItemConfig } from './MenuSection';

interface CreateButtonProps {
  handleMenu: (event: React.MouseEvent<HTMLElement>) => void;
  anchorEl: HTMLElement | null;
  setAnchorEl: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
}

const models = [
  {
    key: 'key-1',
    value: 'argocd-template',
    label: 'Add ArgoCD to an existing project',
  },
  {
    key: 'key-2',
    value: 'create-backend-plugin',
    label: 'Create Backend Plugin Template',
  },
  {
    key: 'key-3',
    value: 'create-frontend-plugin',
    label: 'Create Frontend Plugin Template',
  },
  {
    key: 'key-4',
    value: 'create-react-app-template-test-annotator',
    label: 'Create React App Template with annotations',
  },
  {
    key: 'key-5',
    value: 'define-ansible-job-template',
    label: 'Ansible Job Template',
  },
];

const menuSections = [
  {
    sectionKey: 'templates',
    sectionLabel: 'Use a template',
    optionalLinkLabel: 'All templates',
    optionalLink: '/create',
    items: models.map(m => ({
      itemKey: m.key,
      label: m.label,
      link: `/create/templates/default/${m.value}`,
    })),
    handleClose: () => {},
  },
];

const menuBottomItems: MenuItemConfig[] = [
  {
    itemKey: 'custom',
    icon: CategoryOutlinedIcon,
    label: 'Register a component',
    subLabel: 'Import it to the catalog page',
    link: '/catalog-import',
  },
];
const CreateDropdown: React.FC<CreateButtonProps> = ({
  handleMenu,
  anchorEl,
  setAnchorEl,
}) => {
  return (
    <HeaderDropdownComponent
      buttonContent={
        <>
          Create <ArrowDropDownOutlinedIcon style={{ marginLeft: '0.5rem' }} />
        </>
      }
      menuSections={menuSections}
      menuBottomItems={menuBottomItems}
      buttonProps={{
        color: 'primary',
        variant: 'contained',
        sx: { marginRight: '1rem' },
      }}
      buttonClick={handleMenu}
      anchorEl={anchorEl}
      setAnchorEl={setAnchorEl}
    />
  );
};

export default CreateDropdown;
