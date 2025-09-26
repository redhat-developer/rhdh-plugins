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

import { createTranslationMessages } from '@backstage/core-plugin-api/alpha';
import { marketplaceTranslationRef } from './ref';

const marketplaceTranslationFr = createTranslationMessages({
  ref: marketplaceTranslationRef,
  full: true,
  messages: {
    // Page headers and titles
    'header.title': 'Extensions',
    'header.extensions': 'Extensions',
    'header.catalog': 'Catalogue',
    'header.installedPackages': 'Paquets installés',
    'header.installedPackagesWithCount': 'Paquets installés ({{count}})',
    'header.pluginsPage': 'Plugins',
    'header.packagesPage': 'Packages',
    'header.collectionsPage': 'Collections',

    // Navigation and buttons
    'button.install': 'Installer',
    'button.uninstall': 'Désinstaller',
    'button.enable': 'Activer',
    'button.disable': 'Désactiver',
    'button.update': 'Mettre à jour',
    'button.save': 'Enregistrer',
    'button.close': 'Fermer',
    'button.viewAll': 'Voir tous les plugins',
    'button.viewDocumentation': 'Voir la documentation',
    'button.viewInstalledPlugins': 'Voir les plugins installés ({{count}})',
    'button.restart': 'Redémarrage requis',

    // Status labels
    'status.notInstalled': 'Non installé',
    'status.installed': 'Installé',
    'status.disabled': 'Désactivé',
    'status.partiallyInstalled': 'Partiellement installé',
    'status.updateAvailable': 'Mise à jour disponible',

    // Role labels
    'role.backend': 'Backend',
    'role.backendModule': 'Module backend',
    'role.frontend': 'Frontend',

    // Empty states and errors
    'emptyState.noPluginsFound': 'Aucun plugin trouvé',
    'emptyState.mustEnableBackend': 'Doit activer le plugin backend Extensions',
    'emptyState.noPluginsDescription':
      "Une erreur s'est produite lors du chargement des plugins. Vérifiez votre configuration ou consultez la documentation du plugin pour résoudre. Vous pouvez également explorer d'autres plugins disponibles.",
    'emptyState.configureBackend':
      "Configurez le plugin '@red-hat-developer-hub/backstage-plugin-marketplace-backend'.",

    // Alerts and warnings
    'alert.productionDisabled':
      "L'installation de plugins est désactivée dans l'environnement de production.",
    'alert.installationDisabled': "L'installation de plugins est désactivée.",
    'alert.extensionsExample':
      "Exemple d'activation de l'installation de plugins d'extensions",
    'alert.singlePluginRestart':
      "Le plugin **{{pluginName}}** nécessite un redémarrage du système backend pour terminer l'installation, la mise à jour, l'activation ou la désactivation.",
    'alert.multiplePluginRestart':
      "Vous avez **{{count}}** plugins qui nécessitent un redémarrage de votre système backend pour terminer l'installation, la mise à jour, l'activation ou la désactivation.",
    'alert.restartRequired': '{{count}} plugins installés',
    'alert.backendRestartRequired': 'Redémarrage du backend requis',
    'alert.backendRestartMessage':
      'Pour terminer les modifications du paquet, redémarrez votre système backend.',
    'alert.viewPlugins': 'Voir les plugins',

    // Search and filtering
    'search.placeholder': 'Rechercher des plugins...',
    'search.clear': 'Effacer la recherche',
    'search.filter': 'Filtrer',
    'search.clearFilter': 'Effacer le filtre',
    'search.noResults':
      'Aucun plugin ne correspond à vos critères de recherche',
    'search.filterBy': 'Filtrer par',
    'search.clearFilters': 'Effacer les filtres',
    'search.noResultsFound':
      'Aucun résultat trouvé. Ajustez vos filtres et réessayez.',
    'search.category': 'Catégorie',
    'search.author': 'Auteur',
    'search.supportType': 'Type de support',

    // General UI text
    'common.links': 'Liens',
    'common.by': ' par ',
    'common.comma': ', ',
    'common.noDescriptionAvailable': 'aucune description disponible',
    'common.readMore': 'Lire la suite',
    'common.close': 'Fermer',
    'common.apply': 'Appliquer',
    'common.couldNotApplyYaml': "Impossible d'appliquer le YAML : {{error}}",

    // Dialogs
    'dialog.backendRestartRequired': 'Redémarrage du backend requis',
    'dialog.restartMessage':
      'Pour finaliser les modifications du plugin, redémarrez votre système backend.',

    // Plugin details
    'plugin.description': 'Description',
    'plugin.documentation': 'Documentation',
    'plugin.repository': 'Dépôt',
    'plugin.license': 'Licence',
    'plugin.version': 'Version',
    'plugin.author': 'Auteur',
    'plugin.tags': 'Tags',
    'plugin.dependencies': 'Dépendances',
    'plugin.configuration': 'Configuration',
    'plugin.installation': 'Installation',

    // Package details
    'package.name': 'Nom du package :',
    'package.version': 'Version :',
    'package.dynamicPluginPath': 'Chemin du plugin dynamique :',
    'package.backstageRole': 'Rôle Backstage :',
    'package.supportedVersions': 'Versions supportées :',
    'package.author': 'Auteur :',
    'package.support': 'Support :',
    'package.lifecycle': 'Cycle de vie :',
    'package.highlights': 'Points forts',
    'package.about': 'À propos',
    'package.notFound': 'Package {{namespace}}/{{name}} introuvable !',

    // Tables and lists
    'table.packageName': 'Nom du package',
    'table.version': 'Version',
    'table.role': 'Rôle',
    'table.supportedVersion': 'Version supportée',
    'table.status': 'Statut',
    'table.name': 'Nom',
    'table.action': 'Action',
    'table.description': 'Description',
    'table.versions': 'Versions',
    'table.plugins': 'Plugins',
    'table.packages': 'Packages',
    'table.pluginsCount': 'Plugins ({{count}})',
    'table.packagesCount': 'Packages ({{count}})',
    'table.pluginsTable': 'Tableau des plugins',

    // Installed packages table
    'installedPackages.table.title': 'Packages installés ({{count}})',
    'installedPackages.table.searchPlaceholder': 'Rechercher',
    'installedPackages.table.columns.name': 'Nom',
    'installedPackages.table.columns.packageName': 'Nom du package npm',
    'installedPackages.table.columns.role': 'Rôle',
    'installedPackages.table.columns.version': 'Version',
    'installedPackages.table.columns.actions': 'Actions',
    'installedPackages.table.tooltips.enableActions':
      'Pour activer les actions, ajoutez une entité de catalogue pour ce package',
    'installedPackages.table.emptyMessages.noResults':
      'Aucun résultat trouvé. Essayez un terme de recherche différent.',
    'installedPackages.table.emptyMessages.noRecords':
      'Aucun enregistrement à afficher',

    // Plugin actions and states
    'actions.install': 'Installer',
    'actions.view': 'Voir',
    'actions.edit': 'Modifier',
    'actions.enable': 'Activer',
    'actions.disable': 'Désactiver',
    'actions.actions': 'Actions',
    'actions.editConfiguration': 'Modifier',
    'actions.pluginConfigurations': 'Configurations du plugin',
    'actions.pluginCurrentlyEnabled': 'Plugin actuellement activé',
    'actions.pluginCurrentlyDisabled': 'Plugin actuellement désactivé',
    'actions.installTitle': 'Installer {{displayName}}',
    'actions.editTitle': 'Modifier les configurations de {{displayName}}',

    // Plugin metadata
    'metadata.by': ' par ',
    'metadata.pluginNotFound': 'Plugin {{name}} introuvable !',
    'metadata.highlights': 'Points forts',
    'metadata.about': 'À propos',
    'metadata.publisher': 'Éditeur',
    'metadata.supportProvider': 'Fournisseur de support',

    // Support type filters
    'supportTypes.certifiedBy': 'Certifié par {{value}} ({{count}})',
    'supportTypes.verifiedBy': 'Vérifié par {{value}} ({{count}})',
    'supportTypes.customPlugins': 'Plugins personnalisés ({{count}})',

    // Collections
    'collection.kubernetes': 'Kubernetes',
    'collection.monitoring': 'Surveillance',
    'collection.security': 'Sécurité',
    'collection.viewMore': 'Voir plus',
    'collection.pluginCount': '{{count}} plugins',
    'collection.featured.title': 'Plugins en vedette',
    'collection.featured.description':
      'Une collection organisée de plugins recommandés pour la plupart des utilisateurs',

    // Installation and configuration
    'install.title': 'Installer le plugin',
    'install.configurationRequired': 'Configuration requise',
    'install.optional': 'Optionnel',
    'install.required': 'Requis',
    'install.selectPackages': 'Sélectionner les packages à installer',
    'install.allPackages': 'Tous les packages',
    'install.customConfiguration': 'Configuration personnalisée',
    'install.installProgress': 'Installation...',
    'install.success': 'Plugin installé avec succès',
    'install.error': "Échec de l'installation du plugin",
    'install.installFrontend': 'Installer le plugin frontend',
    'install.installBackend': 'Installer le plugin backend',
    'install.installTemplates': 'Installer les modèles logiciels',
    'install.installationInstructions': "Instructions d'installation",
    'install.download': 'Télécharger',
    'install.examples': 'Exemples',
    'install.cancel': 'Annuler',
    'install.reset': 'Réinitialiser',
    'install.pluginTabs': 'Onglets de plugin',
    'install.settingUpPlugin': 'Configuration du plugin',
    'install.aboutPlugin': 'À propos du plugin',
    'install.pluginUpdated': 'Plugin mis à jour',
    'install.pluginInstalled': 'Plugin installé',
    'install.instructions': 'Instructions',
    'install.editInstructions': 'Modifier les instructions',
    'install.back': 'Retour',
    'install.packageUpdated': 'Package mis à jour',
    'install.errors.missingPluginsList':
      "Contenu de l'éditeur invalide : liste 'plugins' manquante",
    'install.errors.missingPackageItem':
      "Contenu de l'éditeur invalide : élément de package manquant",
    'install.errors.missingPackageField':
      "Contenu de l'éditeur invalide : champ 'package' manquant dans l'élément",
    'install.errors.failedToSave': 'Échec de la sauvegarde',

    // Loading and error states
    loading: 'Chargement...',
    error: "Une erreur s'est produite",
    retry: 'Réessayer',

    // Error messages
    'errors.missingConfigFile': 'Fichier de configuration manquant',
    'errors.missingConfigMessage':
      "{{message}}. Vous devez l'ajouter à votre app-config.yaml si vous voulez activer cet outil. Modifiez le fichier app-config.yaml comme indiqué dans l'exemple ci-dessous :",
    'errors.invalidConfigFile': 'Fichier de configuration invalide',
    'errors.invalidConfigMessage':
      "Échec du chargement de 'extensions.installation.saveToSingleFile.file'. {{message}}. Fournissez une configuration d'installation valide si vous voulez activer cet outil. Modifiez votre fichier dynamic-plugins.yaml comme indiqué dans l'exemple ci-dessous :",
    'errors.fileNotExists':
      "Le fichier de configuration est incorrect, mal orthographié ou n'existe pas",
    'errors.fileNotExistsMessage':
      "{{message}}. Veuillez vérifier le nom de fichier spécifié dans votre app-config.yaml si vous voulez activer cet outil comme mis en évidence dans l'exemple ci-dessous :",
    'errors.unknownError':
      'Erreur lors de la lecture du fichier de configuration. ',

    // Tooltip messages
    'tooltips.productionDisabled':
      "L'installation de plugins est désactivée dans l'environnement de production.",
    'tooltips.extensionsDisabled':
      "L'installation de plugins est désactivée. Pour l'activer, mettez à jour votre configuration d'extensions dans votre fichier app-config.yaml.",
    'tooltips.noPermissions':
      "Vous n'avez pas la permission d'installer des plugins ou de voir leurs configurations. Contactez votre administrateur pour demander l'accès ou de l'aide.",

    // Accessibility
    'aria.openPlugin': 'Ouvrir le plugin {{name}}',
    'aria.closeDialog': 'Fermer la boîte de dialogue',
    'aria.expandSection': 'Développer la section',
    'aria.collapseSection': 'Réduire la section',
    'aria.sortBy': 'Trier par {{field}}',
    'aria.filterBy': 'Filtrer par {{field}}',
    'badges.certified': 'Certifié',
    'badges.certifiedBy': 'Certifié par {{provider}}',
    'badges.verified': 'Vérifié',
    'badges.verifiedBy': 'Vérifié par {{provider}}',
    'badges.customPlugin': 'Plugin personnalisé',
    'badges.stableAndSecured': 'Stable et sécurisé par {{provider}}',
    'badges.generallyAvailable': 'Généralement disponible (GA)',
    'badges.gaAndSupportedBy':
      'Généralement disponible (GA) et supporté par {{provider}}',
    'badges.gaAndSupported': 'Généralement disponible (GA) et supporté',
    'badges.productionReadyBy':
      'Prêt pour la production et supporté par {{provider}}',
    'badges.productionReady': 'Prêt pour la production et supporté',
    'badges.communityPlugin': 'Plugin communautaire',
    'badges.openSourceNoSupport':
      'Plugins open-source, pas de support officiel',
    'badges.techPreview': 'Aperçu technique (TP)',
    'badges.pluginInDevelopment': 'Plugin encore en développement',
    'badges.devPreview': 'Aperçu développeur (DP)',
    'badges.earlyStageExperimental': 'Un plugin expérimental en phase précoce',
    'badges.addedByAdmin': "Plugins ajoutés par l'administrateur",
  },
});

export default marketplaceTranslationFr;
