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

import { createTranslationRef } from '@backstage/core-plugin-api/alpha';

/**
 * Messages object containing all English translations.
 * This is our single source of truth for translations.
 * @public
 */
export const quickstartMessages = {
  header: {
    title: "Let's get you started with Developer Hub",
    subtitle: "We'll guide you through a few quick steps",
  },
  steps: {
    setupAuthentication: {
      title: 'Set up authentication',
      description:
        'Set up secure login credentials to protect your account from unauthorized access.',
      ctaTitle: 'Learn more',
    },
    configureRbac: {
      title: 'Configure RBAC',
      description:
        'Assign roles and permissions to control who can view, create, or edit resources, ensuring secure and efficient collaboration.',
      ctaTitle: 'Manage access',
    },
    configureGit: {
      title: 'Configure Git',
      description:
        'Connect your Git providers, such as GitHub to manage code, automate workflows, and integrate with platform features.',
      ctaTitle: 'Learn more',
    },
    managePlugins: {
      title: 'Manage plugins',
      description:
        'Browse and install extensions to add features, connect with external tools, and customize your experience.',
      ctaTitle: 'Explore plugins',
    },
    importApplication: {
      title: 'Import application',
      description:
        'Import your existing code and services into the catalog to organize and access them through your developer portal.',
      ctaTitle: 'Import',
    },
    learnAboutCatalog: {
      title: 'Learn about the Catalog',
      description:
        'Discover all software components, services, and APIs, and view their owners and documentation.',
      ctaTitle: 'View Catalog',
    },
    exploreSelfServiceTemplates: {
      title: 'Explore Self-service templates',
      description:
        'Use our self-service templates to quickly set up new projects, services, or documentation.',
      ctaTitle: 'Explore templates',
    },
    findAllLearningPaths: {
      title: 'Find all Learning Paths',
      description:
        'Integrate tailored e-learning into your workflows with Learning Paths to accelerate onboarding, close skill gaps, and promote best practices.',
      ctaTitle: 'View Learning Paths',
    },
  },
  button: {
    quickstart: 'Quick start',
    openQuickstartGuide: 'Open Quickstart Guide',
    closeDrawer: 'Close Drawer',
    gotIt: 'Got it!',
  },
  footer: {
    progress: '{{progress}}% progress',
    notStarted: 'Not started',
    hide: 'Hide',
  },
  content: {
    emptyState: {
      title: 'Quickstart content not available for your role.',
    },
  },
  item: {
    expandAriaLabel: 'Expand {{title}} details',
    collapseAriaLabel: 'Collapse {{title}} details',
    expandButtonAriaLabel: 'Expand item',
    collapseButtonAriaLabel: 'Collapse item',
  },
  dev: {
    pageTitle: 'Quickstart Plugin Test Page',
    pageDescription:
      'This is a test page for the Quickstart plugin. Use the buttons below to interact with the quickstart drawer.',
    drawerControls: 'Drawer Controls',
    currentState: 'Current drawer state: {{state}}',
    stateOpen: 'Open',
    stateClosed: 'Closed',
    instructions: 'Instructions',
    step1: '1. Click "Open Quickstart Guide" to open the drawer',
    step2: '2. Navigate through the quickstart steps',
    step3: '3. Test the progress tracking by completing steps',
    step4:
      "4. The drawer can be closed using the close button or the drawer's own controls",
    step5: '5. Progress is automatically saved to localStorage',
  },
};

/**
 * Translation reference for Quickstart plugin
 * @public
 */
export const quickstartTranslationRef = createTranslationRef({
  id: 'plugin.quickstart',
  messages: quickstartMessages,
});
