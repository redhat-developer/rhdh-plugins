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
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import OpenShiftIcon from '../../assets/logos/openshift.png';
import AnsibleIcon from '../../assets/logos/ansible.png';
import OpenShiftAIIcon from '../../assets/logos/openshift-ai.png';
import DevSpacesIcon from '../../assets/logos/devspaces.png';
import OpenshiftVirtualizationIcon from '../../assets/logos/openshift-virtualization.png';

const iconProps = { sx: { width: '16px' } };

const iconMap: Record<'success' | 'warning', JSX.Element> = {
  success: <TaskAltRoundedIcon htmlColor="#8476D1" {...iconProps} />,
  warning: <ErrorOutlineRoundedIcon htmlColor="#009596" {...iconProps} />,
};

const getSandboxCatalogCardIcon = (type: 'success' | 'warning') =>
  iconMap[type] || iconMap.success;

type ProductDescription = {
  icon: JSX.Element;
  value: string;
};

export type ProductData = {
  id: number;
  title: string;
  image: string;
  description: ProductDescription[];
  link: string;
};

export const productData: ProductData[] = [
  {
    id: 1,
    title: 'OpenShift',
    image: OpenShiftIcon,
    description: [
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Comprehensive cloud-native application platform',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Consistently develop and deploy applications at scale',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Streamline application development with CI/CD tools',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value:
          'Manage containers, VMs, and serverless workloads across the hybrid cloud',
      },
    ],
    link: '#',
  },
  {
    id: 2,
    title: 'OpenShift AI',
    image: OpenShiftAIIcon,
    description: [
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Scalable AI and ML platform',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Optimized for AI workloads',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Train, serve and monitor models',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Supports predictive and generative AI',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Scales across the hybrid cloud',
      },
    ],
    link: '#',
  },
  {
    id: 3,
    title: 'Dev Spaces',
    image: DevSpacesIcon,
    description: [
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Cloud Development Environment',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Developer workspaces defined as code',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Kubernetes development made easy',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Near instant onboarding',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'VS Code and JetBrains IDEs',
      },
    ],
    link: '#',
  },
  {
    id: 4,
    title: 'Ansible Automation Platform',
    image: AnsibleIcon,
    description: [
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Scalable, centralized automation solution',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Available on-prem, cloud, and hybrid',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Manage and monitor workflows, content, and execution',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Enforce policies and consistent configurations',
      },
      {
        icon: getSandboxCatalogCardIcon('warning'),
        value: '20-minute environment provisioning',
      },
    ],
    link: '#',
  },
  {
    id: 5,
    title: 'OpenShift Virtualization',
    image: OpenshiftVirtualizationIcon,
    description: [
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Migrate traditional VM workloads to OpenShift',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Unified platform for VMs, containers, and serverless workloads',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Supports modernizing application development',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Comprehensive development and operations tools',
      },
    ],
    link: '#',
  },
];
