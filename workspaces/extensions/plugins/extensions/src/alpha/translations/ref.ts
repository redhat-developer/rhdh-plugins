/*
 * Copyright The Backstage Authors
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
 * @alpha
 */
export const extensionsMessages = {
  // Page headers and titles
  header: {
    title: 'Extensions',
    extensions: 'Extensions',
    catalog: 'Catalog',
    installedPackages: 'Installed packages',
    installedPackagesWithCount: 'Installed packages ({{count}})',
    pluginsPage: 'Plugins',
    packagesPage: 'Packages',
    collectionsPage: 'Collections',
  },

  // Navigation and buttons
  button: {
    install: 'Install',
    uninstall: 'Uninstall',
    enable: 'Enable',
    disable: 'Disable',
    update: 'Update',
    save: 'Save',
    close: 'Close',
    viewAll: 'View all plugins',
    viewDocumentation: 'View documentation',
    viewInstalledPlugins: 'View installed plugins ({{count}})',
    restart: 'Restart required',
  },

  // Status labels
  status: {
    notInstalled: 'Not installed',
    installed: 'Installed',
    disabled: 'Disabled',
    partiallyInstalled: 'Partially installed',
    updateAvailable: 'Update available',
  },

  // Role labels
  role: {
    backend: 'Backend',
    backendModule: 'Backend module',
    frontend: 'Frontend',
  },

  // Empty states and errors
  emptyState: {
    noPluginsFound: 'No plugins found',
    mustEnableBackend: 'Must enable the Extensions backend plugin',
    noPluginsDescription:
      'There was an error with loading plugins. Check your configuration or review plugin documentation to resolve. You can also explore other available plugins.',
    configureBackend:
      "Configure the '@red-hat-developer-hub/backstage-plugin-extensions-backend' plugin.",
  },

  // Alerts and warnings
  alert: {
    productionDisabled:
      'Plugin installation is disabled in the production environment.',
    installationDisabled: 'Plugin installation is disabled.',
    missingDynamicArtifact:
      'Cannot manage this package. To enable actions, a Catalog entity with the required **spec.dynamicArtifact** must be added.',
    missingDynamicArtifactTitle: 'Package cannot be modified',
    missingDynamicArtifactForPlugin:
      'Cannot manage this plugin. To enable actions, a Catalog entity with the required **spec.dynamicArtifact** must be added to all associated packages.',
    missingDynamicArtifactTitlePlugin: 'Plugin cannot be modified',
    extensionsExample:
      'To enable it, add or modify the extensions configuration in your dynamic-plugins configuration file.',
    singlePluginRestart:
      'The **{{pluginName}}** plugin requires a restart of the backend system to finish installing, updating, enabling or disabling.',
    multiplePluginRestart:
      'You have **{{count}}** plugins that require a restart of your backend system to either finish installing, updating, enabling or disabling.',
    singlePackageRestart:
      'The **{{packageName}}** package requires a restart of the backend system to finish installing, updating, enabling or disabling.',
    multiplePackageRestart:
      'You have **{{count}}** packages that require a restart of your backend system to either finish installing, updating, enabling or disabling.',
    restartRequired: '{{count}} plugins installed',
    backendRestartRequired: 'Backend restart required',
    viewPlugins: 'View plugins',
    viewPackages: 'View packages',
  },

  // Search and filtering
  search: {
    placeholder: 'Search',
    clear: 'Clear Search',
    filter: 'Filter',
    clearFilter: 'Clear Filter',
    category: 'Category',
    author: 'Author',
    supportType: 'Support type',
    noResults: 'No plugins match your search criteria',
    filterBy: 'Filter by',
    clearFilters: 'Clear filters',
    noResultsFound: 'No results found. Adjust your filters and try again.',
  },

  // General UI text
  common: {
    links: 'Links',
    by: ' by ',
    comma: ', ',
    noDescriptionAvailable: 'no description available',
    readMore: 'Read more',
    close: 'Close',
    apply: 'Apply',
    couldNotApplyYaml: 'Could not apply YAML: {{error}}',
  },

  // Dialogs
  dialog: {
    backendRestartRequired: 'Backend restart required',
    packageRestartMessage:
      'To finish the package modifications, restart your backend system.',
    pluginRestartMessage:
      'To finish the plugin modifications, restart your backend system.',
  },

  // Plugin details
  plugin: {
    description: 'Description',
    documentation: 'Documentation',
    repository: 'Repository',
    license: 'License',
    version: 'Version',
    author: 'Author',
    authors: 'Authors',
    tags: 'Tags',
    dependencies: 'Dependencies',
    configuration: 'Configuration',
    installation: 'Installation',
  },

  // Package details
  package: {
    name: 'Package name:',
    version: 'Version:',
    dynamicPluginPath: 'Dynamic plugin path:',
    backstageRole: 'Backstage role:',
    supportedVersions: 'Supported versions:',
    author: 'Author:',
    support: 'Support:',
    lifecycle: 'Lifecycle:',
    highlights: 'Highlights',
    about: 'About',
    notFound: 'Package {{namespace}}/{{name}} not found!',
    notAvailable: 'Package {{name}} is not available',
    ensureCatalogEntity: 'Ensure a catalog entity exists for this package.',
  },

  // Tables and lists
  table: {
    packageName: 'Package name',
    version: 'Version',
    role: 'Role',
    supportedVersion: 'Supported version',
    status: 'Status',
    name: 'Name',
    action: 'Action',
    description: 'Description',
    versions: 'Versions',
    plugins: 'Plugins',
    packages: 'Packages',
    pluginsCount: 'Plugins ({{count}})',
    packagesCount: 'Packages ({{count}})',
    pluginsTable: 'Plugins table',
  },

  // Installed packages table
  installedPackages: {
    table: {
      title: 'Installed packages ({{count}})',
      searchPlaceholder: 'Search',
      columns: {
        name: 'Name',
        packageName: 'npm package name',
        role: 'Role',
        version: 'Version',
        actions: 'Actions',
      },
      tooltips: {
        packageProductionDisabled:
          'Package cannot be managed in the production environment.',
        installationDisabled:
          'Package cannot be managed because plugin installation is disabled. To enable it, add or modify the extensions configuration in your dynamic-plugins configuration file.',
        enableActions:
          'To enable actions, add a catalog entity for this package',
        noDownloadPermissions:
          "You don't have permission to download the configuration. Contact your administrator to request access or assistance.",
        noEditPermissions:
          "You don't have permission to edit the configuration. Contact your administrator to request access or assistance.",
        noTogglePermissions:
          "You don't have permission to enable or disable packages. Contact your administrator to request access or assistance.",
        editPackage: 'Edit package configuration',
        downloadPackage: 'Download package configuration',
        enablePackage: 'Enable package',
        disablePackage: 'Disable package',
      },
      emptyMessages: {
        noResults: 'No results found. Try a different search term.',
        noRecords: 'No records to display',
      },
    },
  },

  // Plugin actions and states
  actions: {
    install: 'Install',
    view: 'View',
    edit: 'Edit',
    enable: 'Enable',
    disable: 'Disable',
    actions: 'Actions',
    editConfiguration: 'Edit',
    pluginConfigurations: 'Plugin configurations',
    packageConfiguration: 'Package configuration',
    pluginCurrentlyEnabled: 'Plugin currently enabled',
    pluginCurrentlyDisabled: 'Plugin currently disabled',
    packageCurrentlyEnabled: 'Package currently enabled',
    packageCurrentlyDisabled: 'Package currently disabled',
    installTitle: 'Install {{displayName}}',
    editTitle: 'Edit {{displayName}} configurations',
  },

  // Plugin metadata
  metadata: {
    by: ' by ',
    comma: ', ',
    pluginNotFound: 'Plugin {{name}} not found!',
    pluginNotAvailable: 'Plugin {{name}} is not available',
    ensureCatalogEntityPlugin:
      'Ensure a catalog entity exists for this plugin.',
    highlights: 'Highlights',
    about: 'About',
    publisher: 'Publisher',
    supportProvider: 'Support Provider',
    entryName: 'Entry name',
    bySomeone: 'by someone',
    category: 'Category',
    versions: 'Versions',
    backstageCompatibility: 'Backstage compatibility version',
  },

  // Support type filters
  supportTypes: {
    certifiedBy: 'Certified by {{value}} ({{count}})',
    verifiedBy: 'Verified by {{value}} ({{count}})',
    customPlugins: 'Custom plugins ({{count}})',
  },

  // Collections
  collection: {
    kubernetes: 'Kubernetes',
    monitoring: 'Monitoring',
    security: 'Security',
    viewMore: 'View more',
    pluginCount: '{{count}} plugins',
    featured: {
      title: 'Featured Plugins',
      description:
        'A curated collection of featured plugins recommended for most users',
    },
  },

  // Installation and configuration
  install: {
    title: 'Install Plugin',
    configurationRequired: 'Configuration required',
    optional: 'Optional',
    required: 'Required',
    selectPackages: 'Select packages to install',
    allPackages: 'All packages',
    customConfiguration: 'Custom configuration',
    installProgress: 'Installing...',
    success: 'Plugin installed successfully',
    error: 'Failed to install plugin',
    installFrontend: 'Install front-end plugin',
    installBackend: 'Install back-end plugin',
    installTemplates: 'Install software templates',
    installationInstructions: 'Installation instructions',
    download: 'Download',
    examples: 'Examples',
    cancel: 'Cancel',
    reset: 'Reset',
    pluginTabs: 'Plugin tabs',
    settingUpPlugin: 'Setting up the plugin',
    aboutPlugin: 'About the plugin',
    pluginUpdated: 'Plugin updated',
    pluginInstalled: 'Plugin installed',
    instructions: 'Instructions',
    editInstructions: 'Edit instructions',
    back: 'Back',
    packageUpdated: 'Package updated',
    packageEnabled: 'Package enabled',
    packageDisabled: 'Package disabled',
    pluginEnabled: 'Plugin enabled',
    pluginDisabled: 'Plugin disabled',
    errors: {
      missingPluginsList: "Invalid editor content: missing 'plugins' list",
      missingPackageItem: 'Invalid editor content: missing package item',
      missingPackageField:
        "Invalid editor content: 'package' field missing in item",
      failedToSave: 'Failed to save',
    },
  },

  // Loading and error states
  loading: 'Loading...',
  error: 'An error occurred',
  retry: 'Retry',

  // Error messages
  errors: {
    missingConfigFile: 'Missing configuration file',
    missingConfigMessage:
      '{{message}}. You need to add it to your app-config.yaml if you want to enable this tool. Edit the app-config.yaml file as shown in the example below:',
    invalidConfigFile: 'Invalid configuration file',
    invalidConfigMessage:
      "Failed to load 'extensions.installation.saveToSingleFile.file'. {{message}}. Provide valid installation configuration if you want to enable this tool. Edit your dynamic-plugins.yaml file as shown in the example below:",
    fileNotExists:
      'Configuration file is incorrect, misspelled or does not exist',
    fileNotExistsMessage:
      '{{message}}. Please re-check the specified file name in your app-config.yaml if you want to enable this tool as highlighted in the example below:',
    unknownError: 'Error reading the configuration file. ',
  },

  // Tooltip messages
  tooltips: {
    productionDisabled:
      'Plugin installation is disabled in the production environment.',
    extensionsDisabled:
      'Plugin installation is disabled. To enable it, add or modify the extensions configuration in your dynamic-plugins configuration file.',
    noPermissions:
      "You don't have permission to install plugins or view their configurations. Contact your administrator to request access or assistance.",
    missingDynamicArtifact:
      'Cannot manage this {{type}}. To enable actions, a Catalog entity with the required spec.dynamicArtifact must be added.',
  },

  // Accessibility
  aria: {
    openPlugin: 'Open plugin {{name}}',
    closeDialog: 'Close dialog',
    expandSection: 'Expand section',
    collapseSection: 'Collapse section',
    sortBy: 'Sort by {{field}}',
    filterBy: 'Filter by {{field}}',
  },

  // Badge labels and tooltips
  badges: {
    certified: 'Certified',
    certifiedBy: 'Certified by {{provider}}',
    verified: 'Verified',
    verifiedBy: 'Verified by {{provider}}',
    customPlugin: 'Custom plugin',
    stableAndSecured: 'Stable and secured by {{provider}}',
    generallyAvailable: 'Generally available (GA)',
    gaAndSupportedBy: 'Generally available (GA) and supported by {{provider}}',
    gaAndSupported: 'Generally available (GA) and supported',
    productionReadyBy: 'Production-ready and supported by {{provider}}',
    productionReady: 'Production-ready and supported',
    communityPlugin: 'Community plugin',
    openSourceNoSupport: 'Open-source plugins, no official support',
    techPreview: 'Tech preview (TP)',
    pluginInDevelopment: 'Plugin still in development',
    devPreview: 'Dev preview (DP)',
    earlyStageExperimental: 'An early-stage, experimental plugin',
    addedByAdmin: 'Plugins added by the administrator',
  },
};

/**
 * Translation reference for extensions plugin
 * @alpha
 */
export const extensionsTranslationRef = createTranslationRef({
  id: 'plugin.extensions',
  messages: extensionsMessages,
});
