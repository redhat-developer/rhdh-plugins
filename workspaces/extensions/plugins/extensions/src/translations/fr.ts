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

import { createTranslationMessages } from '@backstage/core-plugin-api/alpha';
import { extensionsTranslationRef } from './ref';

const extensionsTranslationFr = createTranslationMessages({
  ref: extensionsTranslationRef,
  full: true,
  messages: {
    'header.title': 'Extensions',
    'header.extensions': 'Extensions',
    'header.catalog': 'Catalogue',
    'header.installedPackages': 'Paquets installés',
    'header.installedPackagesWithCount': 'Paquets installés ({{count}})',
    'header.pluginsPage': 'Plugins',
    'header.packagesPage': 'Paquets',
    'header.collectionsPage': 'Collections',
    'button.install': 'Installer',
    'button.uninstall': 'Désinstaller',
    'button.enable': 'Activer',
    'button.disable': 'Désactiver',
    'button.update': 'Mise à jour',
    'button.save': 'Sauvegarder',
    'button.close': 'Fermer',
    'button.viewAll': 'Voir tous les plugins',
    'button.viewDocumentation': 'Voir la documentation',
    'button.viewInstalledPlugins': 'Afficher les plugins installés ({{count}})',
    'button.restart': 'Redémarrage requis',
    'status.notInstalled': 'Non installé',
    'status.installed': 'Installé',
    'status.disabled': 'Désactivé',
    'status.partiallyInstalled': 'Partiellement installé',
    'status.updateAvailable': 'Mise à jour disponible',
    'role.backend': 'Backend',
    'role.backendModule': 'Module backend',
    'role.frontend': "L'extrémité avant",
    'emptyState.noPluginsFound': 'Aucun plugin trouvé',
    'emptyState.mustEnableBackend': 'Doit activer le plugin backend Extensions',
    'emptyState.noPluginsDescription':
      "Une erreur s'est produite lors du chargement des plugins. Vérifiez votre configuration ou consultez la documentation du plugin pour résoudre le problème. Vous pouvez également explorer d’autres plugins disponibles.",
    'emptyState.configureBackend':
      "Configurez le plugin '@red-hat-developer-hub/backstage-plugin-extensions-backend'.",
    'alert.productionDisabled':
      "L'installation du plugin est désactivée dans l'environnement de production.",
    'alert.installationDisabled': "L'installation du plugin est désactivée.",
    'alert.missingDynamicArtifact':
      'Impossible de gérer ce paquet. Pour activer les actions, un catalogue avec l’  **spec.dynamicArtifact** requis doit être ajouté.',
    'alert.missingDynamicArtifactTitle': 'Le paquet ne peut pas être modifié',
    'alert.missingDynamicArtifactForPlugin':
      'Impossible de gérer ce plugin. Pour activer les actions, un catalogue avec l’  **spec.dynamicArtifact** requis doit être ajouté.',
    'alert.missingDynamicArtifactTitlePlugin':
      'Le plugin ne peut pas être modifié',
    'alert.extensionsExample':
      'Pour l’activer, ajouter ou modifier la configuration des extensions dans votre fichier de configuration dynamic-plugins.',
    'alert.singlePluginRestart':
      "Le plugin **{{pluginName}}** nécessite un redémarrage du système backend pour terminer l'installation, la mise à jour, l'activation ou la désactivation.",
    'alert.multiplePluginRestart':
      "Vous avez **{{count}}** plugins qui nécessitent un redémarrage de votre système backend pour terminer l'installation, la mise à jour, l'activation ou la désactivation.",
    'alert.singlePackageRestart':
      'Le paquet **{{packageName}}** nécessite un redémarrage du système backend pour terminer d’installer, mettre à jour, activer ou désactiver.',
    'alert.multiplePackageRestart':
      'Vous avez **{{count}}** paquets nécessitant un redémarrge de votre système backend pour terminer d’installer, mettre à jour, activer ou désactiver.',
    'alert.restartRequired': '{{count}} plugins installés',
    'alert.backendRestartRequired': 'Redémarrage du backend requis',
    'alert.viewPlugins': 'Afficher les plugins',
    'alert.viewPackages': 'Afficher les paquets',
    'search.placeholder': 'Recherche',
    'search.clear': 'Effacer la recherche',
    'search.filter': 'Filtre',
    'search.clearFilter': 'Effacer le filtre',
    'search.category': 'Catégorie',
    'search.author': 'Auteur',
    'search.supportType': 'Type de support',
    'search.noResults':
      'Aucun plugin ne correspond à vos critères de recherche',
    'search.filterBy': 'Filtrer par',
    'search.clearFilters': 'Effacer les filtres',
    'search.noResultsFound':
      'Aucun résultat trouvé. Ajustez vos filtres et réessayez.',
    'common.links': 'Links',
    'common.by': ' par ',
    'common.comma': ', ',
    'common.noDescriptionAvailable': 'aucune description disponible',
    'common.readMore': 'En savoir plus',
    'common.close': 'Fermer',
    'common.apply': 'Appliquer',
    'common.couldNotApplyYaml': "Impossible d'appliquer YAML : {{error}}",
    'dialog.backendRestartRequired': 'Redémarrage du backend requis',
    'dialog.packageRestartMessage':
      'Pour terminer les modifications du paquet, redémarrez votre système backend.',
    'dialog.pluginRestartMessage':
      'Pour terminer les modifications du plugin, redémarrez votre système backend.',
    'plugin.description': 'Description',
    'plugin.documentation': 'Documentation',
    'plugin.repository': 'Dépôt',
    'plugin.license': 'Licence',
    'plugin.version': 'Version',
    'plugin.author': 'Auteur',
    'plugin.authors': 'Auteurs',
    'plugin.tags': 'Mots-clés',
    'plugin.dependencies': 'Dépendances',
    'plugin.configuration': 'Configuration',
    'plugin.installation': 'Installation',
    'package.name': 'Nom du paquet :',
    'package.version': 'Version:',
    'package.dynamicPluginPath': 'Chemin du plugin dynamique :',
    'package.backstageRole': 'Rôle backstage:',
    'package.supportedVersions': 'Versions prises en charge :',
    'package.author': 'Auteur:',
    'package.support': 'Support:',
    'package.lifecycle': 'Cycle de vie:',
    'package.highlights': 'Points forts',
    'package.about': 'À propos',
    'package.notFound': 'Paquet {{namespace}}/{{name}} introuvable !',
    'package.notAvailable': 'Paquet {{name}} non disponible',
    'package.ensureCatalogEntity':
      "Veillez à ce que l'entité de catalogue existe pour ce paquet.",
    'table.packageName': 'Nom du paquet',
    'table.version': 'Version',
    'table.role': 'Rôle',
    'table.supportedVersion': 'Version prise en charge',
    'table.status': 'Statut',
    'table.name': 'Nom',
    'table.action': 'Action',
    'table.description': 'Description',
    'table.versions': 'Versions',
    'table.plugins': 'Plugins',
    'table.packages': 'Paquets',
    'table.pluginsCount': 'Plugins ({{count}})',
    'table.packagesCount': 'Paquets ({{count}})',
    'table.pluginsTable': 'Tableau des plugins',
    'installedPackages.table.title': 'Paquets installés ({{count}})',
    'installedPackages.table.searchPlaceholder': 'Recherche',
    'installedPackages.table.columns.name': 'Nom',
    'installedPackages.table.columns.packageName': 'nom du paquet npm',
    'installedPackages.table.columns.role': 'Rôle',
    'installedPackages.table.columns.version': 'Version',
    'installedPackages.table.columns.actions': 'Actes',
    'installedPackages.table.tooltips.packageProductionDisabled':
      'Le paquet ne peut pas être géré en environnement de production.',
    'installedPackages.table.tooltips.installationDisabled':
      'Le paquet ne peut pas être géré car le plugin d’installation est désactivé. Pour l’activer, ajouter ou modifier la configuration des extensions dans votre fichier de configuration dynamic-plugins.',
    'installedPackages.table.tooltips.enableActions':
      'Pour activer les actions, ajoutez une entité de catalogue pour ce paquet',
    'installedPackages.table.tooltips.noDownloadPermissions':
      'Vous n’avez pas l’autorisation de télécharger la configuration. Contactez votre administrateur pour demander un accès ou une assistance.',
    'installedPackages.table.tooltips.noEditPermissions':
      'Vous n’avez pas la permission de modifier la configuration. Contactez votre administrateur pour demander un accès ou une assistance.',
    'installedPackages.table.tooltips.noTogglePermissions':
      'Vous n’avez pas la permission d’activer ou de désactiver les paquets. Contactez votre administrateur pour demander un accès ou une assistance.',
    'installedPackages.table.tooltips.editPackage':
      'Modifier la configuration du paquet',
    'installedPackages.table.tooltips.downloadPackage':
      'Télécharger la configuration du paquet',
    'installedPackages.table.tooltips.enablePackage': 'Activer le paquet',
    'installedPackages.table.tooltips.disablePackage': 'Désactiver le paquet',
    'installedPackages.table.emptyMessages.noResults':
      'Aucun résultat trouvé. Essayez un autre terme de recherche.',
    'installedPackages.table.emptyMessages.noRecords':
      'Aucun enregistrement à afficher',
    'actions.install': 'Installer',
    'actions.view': 'Voir',
    'actions.edit': 'Modifier',
    'actions.enable': 'Activer',
    'actions.disable': 'Désactiver',
    'actions.actions': 'Actes',
    'actions.editConfiguration': 'Modifier',
    'actions.pluginConfigurations': 'Configurations des plugins',
    'actions.packageConfiguration': 'Configuration du paquet',
    'actions.pluginCurrentlyEnabled': 'Plugin actuellement activé',
    'actions.pluginCurrentlyDisabled': 'Plugin actuellement désactivé',
    'actions.packageCurrentlyEnabled': 'Paquet actuellement activé',
    'actions.packageCurrentlyDisabled': 'Paquet actuellement désactivé',
    'actions.installTitle': 'Installer {{displayName}}',
    'actions.editTitle': 'Modifier les configurations {{displayName}}',
    'metadata.by': ' par ',
    'metadata.comma': ', ',
    'metadata.pluginNotFound': 'Plugin {{name}} non trouvé !',
    'metadata.pluginNotAvailable': 'Plugin {{name}} non disponible',
    'metadata.ensureCatalogEntityPlugin':
      'Veillez à ce que l’entité de catalogue existe pour ce paquet.',
    'metadata.highlights': 'Points forts',
    'metadata.about': 'À propos',
    'metadata.publisher': 'Éditeur',
    'metadata.supportProvider': 'Fournisseur de support',
    'metadata.entryName': 'Nom de l’entrée',
    'metadata.bySomeone': 'par quelqu’un',
    'metadata.category': 'Catégorie',
    'metadata.versions': 'Versions',
    'metadata.backstageCompatibility': 'Version de compatibilité backstage',
    'supportTypes.certifiedBy': 'Certifié par {{value}} ({{count}})',
    'supportTypes.verifiedBy': 'Vérifié par {{value}} ({{count}})',
    'supportTypes.customPlugins': 'Plugins personnalisés ({{count}})',
    'collection.kubernetes': 'Kubernetes',
    'collection.monitoring': 'Surveillance',
    'collection.security': 'Sécurité',
    'collection.viewMore': 'Voir davantage',
    'collection.pluginCount': '{{count}} plugins',
    'collection.featured.title': 'Plugins en vedette',
    'collection.featured.description':
      'Une collection organisée de plugins recommandés pour la plupart des utilisateurs',
    'install.title': 'Installer le plugin',
    'install.configurationRequired': 'Configuration requise',
    'install.optional': 'Facultatif',
    'install.required': 'Requis',
    'install.selectPackages': 'Sélectionnez les paquets à installer',
    'install.allPackages': 'Tous les paquets',
    'install.customConfiguration': 'Configuration personnalisée',
    'install.installProgress': 'Installation...',
    'install.success': 'Plugin installé avec succès',
    'install.error': "Échec de l'installation du plugin",
    'install.installFrontend': 'Installer le plugin frontal',
    'install.installBackend': 'Installer le plugin back-end',
    'install.installTemplates': 'Installer des modèles de logiciels',
    'install.installationInstructions': "Instructions d'installation",
    'install.download': 'Télécharger',
    'install.examples': 'Exemples',
    'install.cancel': 'Annuler',
    'install.reset': 'Réinitialiser',
    'install.pluginTabs': 'Onglets de plugins',
    'install.settingUpPlugin': 'Configuration du plugin',
    'install.aboutPlugin': 'À propos du plugin',
    'install.pluginUpdated': 'Plugin mis à jour',
    'install.pluginInstalled': 'Plugin installé',
    'install.instructions': 'Instructions',
    'install.editInstructions': 'Modifier les instructions',
    'install.back': 'Retour',
    'install.packageUpdated': 'Paquet mis à jour',
    'install.packageEnabled': 'Paquet activé',
    'install.packageDisabled': 'Paquet non activé',
    'install.pluginEnabled': 'Plugin activé',
    'install.pluginDisabled': 'Plugin non activé',
    'install.errors.missingPluginsList':
      "Contenu de l'éditeur non valide : liste des « plugins » manquante",
    'install.errors.missingPackageItem':
      "Contenu de l'éditeur non valide : élément de paquet manquant",
    'install.errors.missingPackageField':
      "Contenu de l'éditeur non valide : champ « package » manquant dans l'élément",
    'install.errors.failedToSave': 'Échec de la sauvegarde',
    loading: 'Chargement en cours...',
    error: "Une erreur s'est produite",
    retry: 'Réessayer',
    'errors.missingConfigFile': 'Fichier de configuration manquant',
    'errors.missingConfigMessage':
      "{{message}}. Vous devez l'ajouter à votre app-config.yaml si vous souhaitez activer cet outil. Modifiez le fichier app-config.yaml comme indiqué dans l'exemple ci-dessous :",
    'errors.invalidConfigFile': 'Fichier de configuration non valide',
    'errors.invalidConfigMessage':
      "Échec du chargement de « extensions.installation.saveToSingleFile.file ». {{message}}. Fournissez une configuration d'installation valide si vous souhaitez activer cet outil. Modifiez votre fichier dynamic-plugins.yaml comme indiqué dans l'exemple ci-dessous :",
    'errors.fileNotExists':
      "Le fichier de configuration est incorrect, mal orthographié ou n'existe pas",
    'errors.fileNotExistsMessage':
      "{{message}}. Veuillez revérifier le nom de fichier spécifié dans votre app-config.yaml si vous souhaitez activer cet outil comme indiqué dans l'exemple ci-dessous :",
    'errors.unknownError':
      'Erreur lors de la lecture du fichier de configuration. ',
    'tooltips.productionDisabled':
      "L'installation du plugin est désactivée dans l'environnement de production.",
    'tooltips.extensionsDisabled':
      "L'installation du plugin est désactivée. Pour l’activer, ajouter ou modifier la configuration des extensions dans votre fichier de configuration dynamic-plugins.",
    'tooltips.noPermissions':
      "Vous n'avez pas l'autorisation d'installer des plugins ou d'afficher leurs configurations. Contactez votre administrateur pour demander un accès ou une assistance.",
    'tooltips.missingDynamicArtifact':
      'Impossible de gérer ce {{type}}. Pour activer les actions, un catalogue avec le spec.dynamicArtifact requis doit être ajouté.',
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
      'Généralement disponible (GA) et pris en charge par {{provider}}',
    'badges.gaAndSupported': 'Généralement disponible (GA) et pris en charge',
    'badges.productionReadyBy':
      'Prêt pour la production et pris en charge par {{provider}}',
    'badges.productionReady': 'Prêt pour la production et pris en charge',
    'badges.communityPlugin': 'Plugin communautaire',
    'badges.openSourceNoSupport':
      'Plugins open source, pas de support officiel',
    'badges.techPreview': 'Aperçu technique (TP)',
    'badges.pluginInDevelopment': 'Plugin toujours en développement',
    'badges.devPreview': 'Aperçu du développement (DP)',
    'badges.earlyStageExperimental':
      'Un plugin expérimental en phase de démarrage',
    'badges.addedByAdmin': "Plugins ajoutés par l'administrateur",
  },
});

export default extensionsTranslationFr;
