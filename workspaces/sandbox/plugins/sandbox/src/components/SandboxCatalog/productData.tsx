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
import DeveloperHubIcon from '../../assets/images/developer-hub.png';
import OpenShiftIcon from '../../assets/images/openshift.png';
import AnsibleIcon from '../../assets/images/ansible.png';
import OpenShiftAIIcon from '../../assets/images/openshift-ai.png';
import DevSpacesIcon from '../../assets/images/dev-spaces.png';
import DataScienceIcon from '../../assets/images/data-science.png';

const getSandboxCatalogCardIcon = (type: 'success' | 'warning') => {
  const iconProps = { style: { width: '16px' } };
  switch (type) {
    case 'success':
      return <TaskAltRoundedIcon htmlColor="#8476D1" {...iconProps} />;
    case 'warning':
      return <ErrorOutlineRoundedIcon htmlColor="#009596" {...iconProps} />;
    default:
      return <TaskAltRoundedIcon htmlColor="#8476D1" {...iconProps} />;
  }
};

type ProductDescription = {
  icon: JSX.Element;
  value: string;
};

type ProductData = {
  title: string;
  image: {
    icon: string;
    maxWidth: string;
  };
  description: ProductDescription[];
  link: string;
};

export const productData: ProductData[] = [
  {
    title: 'Red Hat Developer Hub',
    image: {
      icon: DeveloperHubIcon,
      maxWidth: '207px',
    },
    description: [
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Speeds up building and deployment',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'One-stop API access for developers',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Enables single sign-on (SSO)',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Supports organizational growth',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Integrates GitLab for source control',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Simplifies resource access',
      },
    ],
    link: '#',
  },
  {
    title: 'Red Hat Ansible Automation Platform',
    image: {
      icon: AnsibleIcon,
      maxWidth: '207px',
    },
    description: [
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Across on-premise, cloud, and hybrid',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Manages workflows at scale',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Enforces policies across systems',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Reduces manual tasks',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Easy UI for design and monitoring',
      },
      {
        icon: getSandboxCatalogCardIcon('warning'),
        value: "It'll take up to 20 minutes to provision",
      },
    ],
    link: '#',
  },
  {
    title: 'Red Hat OpenShift AI',
    image: {
      icon: OpenShiftAIIcon,
      maxWidth: '190px',
    },
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
        value: 'Easy model management',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Supports multiple AI frameworks',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Built-in AI workload security',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Integration with OpenShift',
      },
    ],
    link: '#',
  },
  {
    title: 'Red Hat OpenShift',
    image: {
      icon: OpenShiftIcon,
      maxWidth: '180px',
    },
    description: [
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'A cloud-native application platform',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Manage development securely',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Standardize CI/CD workflows',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Supports organizational growth',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Support for multiple environments',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Trial without commitment',
      },
    ],
    link: '#',
  },
  {
    title: 'Red Hat Dev Spaces',
    image: {
      icon: DevSpacesIcon,
      maxWidth: '190px',
    },
    description: [
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Kubernetes-native collaboration',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Speeds up app development',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Consistent OpenShift environments',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Start coding in under 2 minutes',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Code from any browser',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Trial without commitment',
      },
    ],
    link: '#',
  },
  {
    title: 'Red Hat Data Science',
    image: {
      icon: DataScienceIcon,
      maxWidth: '190px',
    },
    description: [
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Part of the Red Hat OpenShift AI portfolio',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Provides tools for the AI/ML lifecycle',
      },
      {
        icon: getSandboxCatalogCardIcon('success'),
        value: 'Trial without commitment',
      },
    ],
    link: '#',
  },
];
