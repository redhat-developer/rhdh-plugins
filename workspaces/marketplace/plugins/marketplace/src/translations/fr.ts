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
    'actions.actions': 'Actes',
    'actions.disable': 'Désactiver',
    'actions.edit': 'Modifier',
    'actions.editConfiguration': 'Modifier',
    'actions.editTitle': 'Modifier les configurations {{displayName}}',
    'actions.enable': 'Activer',
    'actions.install': 'Installer',
    'actions.installTitle': 'Installer {{displayName}}',
    'actions.pluginConfigurations': 'Configurations des plugins',
    'actions.packageConfiguration': 'Configuration du paquet',
    'actions.pluginCurrentlyDisabled': 'Plugin actuellement désactivé',
    'actions.pluginCurrentlyEnabled': 'Plugin actuellement activé',
    'actions.packageCurrentlyEnabled': 'Paquet actuellement activé',
    'actions.packageCurrentlyDisabled': 'Paquet actuellement désactivé',
    'actions.view': 'Voir',
    'alert.backendRestartRequired': 'Redémarrage du backend requis',
    'alert.extensionsExample':
      "Exemple de comment activer l'installation de plugins d'extensions",
    'alert.installationDisabled': "L'installation du plugin est désactivée.",
    'alert.multiplePluginRestart':
      "Vous avez **{{count}}** plugins qui nécessitent un redémarrage de votre système backend pour terminer l'installation, la mise à jour, l'activation ou la désactivation.",
    'alert.productionDisabled':
      "L'installation du plugin est désactivée dans l'environnement de production.",
    'alert.restartRequired': '{{count}} plugins installés',
    'alert.singlePluginRestart':
      "Le plugin **{{pluginName}}** nécessite un redémarrage du système backend pour terminer l'installation, la mise à jour, l'activation ou la désactivation.",
    'alert.singlePackageRestart':
      "Le paquet **{{packageName}}** nécessite un redémarrage du système backend pour terminer l'installation, la mise à jour, l'activation ou la désactivation.",
    'alert.multiplePackageRestart':
      "Vous avez **{{count}}** paquets qui nécessitent un redémarrage de votre système backend pour terminer l'installation, la mise à jour, l'activation ou la désactivation.",
    'alert.viewPlugins': 'Afficher les plugins',
    'alert.viewPackages': 'Afficher les paquets',
    'aria.closeDialog': 'Fermer la boîte de dialogue',
    'aria.collapseSection': 'Réduire la section',
    'aria.expandSection': 'Développer la section',
    'aria.filterBy': 'Filtrer par {{field}}',
    'aria.openPlugin': 'Ouvrir le plugin {{name}}',
    'aria.sortBy': 'Trier par {{field}}',
    'badges.addedByAdmin': "Plugins ajoutés par l'administrateur",
    'badges.certified': 'Certifié',
    'badges.certifiedBy': 'Certifié par {{provider}}',
    'badges.communityPlugin': 'Plugin communautaire',
    'badges.customPlugin': 'Plugin personnalisé',
    'badges.devPreview': 'Aperçu du développement (DP)',
    'badges.earlyStageExperimental':
      'Un plugin expérimental en phase de démarrage',
    'badges.gaAndSupported': 'Généralement disponible (GA) et pris en charge',
    'badges.gaAndSupportedBy':
      'Généralement disponible (GA) et pris en charge par {{provider}}',
    'badges.generallyAvailable': 'Généralement disponible (GA)',
    'badges.openSourceNoSupport':
      'Plugins open source, pas de support officiel',
    'badges.pluginInDevelopment': 'Plugin toujours en développement',
    'badges.productionReady': 'Prêt pour la production et pris en charge',
    'badges.productionReadyBy':
      'Prêt pour la production et pris en charge par {{provider}}',
    'badges.stableAndSecured': 'Stable et sécurisé par {{provider}}',
    'badges.techPreview': 'Aperçu technique (TP)',
    'badges.verified': 'Vérifié',
    'badges.verifiedBy': 'Vérifié par {{provider}}',
    'button.close': 'Fermer',
    'button.disable': 'Désactiver',
    'button.enable': 'Activer',
    'button.install': 'Installer',
    'button.restart': 'Redémarrage requis',
    'button.save': 'Sauvegarder',
    'button.uninstall': 'Désinstaller',
    'button.update': 'Mise à jour',
    'button.viewAll': 'Voir tous les plugins',
    'button.viewDocumentation': 'Voir la documentation',
    'button.viewInstalledPlugins': 'Afficher les plugins installés ({{count}})',
    'collection.featured.description':
      'Une collection organisée de plugins recommandés pour la plupart des utilisateurs',
    'collection.featured.title': 'Plugins en vedette',
    'collection.kubernetes': 'Kubernetes',
    'collection.monitoring': 'Surveillance',
    'collection.pluginCount': '{{count}} plugins',
    'collection.security': 'Sécurité',
    'collection.viewMore': 'Voir plus',
    'common.apply': 'Appliquer',
    'common.by': ' par ',
    'common.close': 'Fermer',
    'common.comma': ', ',
    'common.couldNotApplyYaml': "Impossible d'appliquer YAML : {{error}}",
    'common.links': 'Links',
    'common.noDescriptionAvailable': 'aucune description disponible',
    'common.readMore': 'En savoir plus',
    'dialog.backendRestartRequired': 'Redémarrage du backend requis',
    'dialog.packageRestartMessage':
      'Pour terminer les modifications du paquet, redémarrez votre système backend.',
    'dialog.pluginRestartMessage':
      'Pour terminer les modifications du plugin, redémarrez votre système backend.',
    'emptyState.configureBackend':
      "Configurez le plugin '@red-hat-developer-hub/backstage-plugin-marketplace-backend'.",
    'emptyState.mustEnableBackend': 'Doit activer le plugin backend Extensions',
    'emptyState.noPluginsDescription':
      "Une erreur s'est produite lors du chargement des plugins. Vérifiez votre configuration ou consultez la documentation du plugin pour résoudre le problème. Vous pouvez également explorer d’autres plugins disponibles.",
    'emptyState.noPluginsFound': 'Aucun plugin trouvé',
    error: "Une erreur s'est produite",
    'errors.fileNotExists':
      "Le fichier de configuration est incorrect, mal orthographié ou n'existe pas",
    'errors.fileNotExistsMessage':
      "{{message}}. Veuillez revérifier le nom de fichier spécifié dans votre app-config.yaml si vous souhaitez activer cet outil comme indiqué dans l'exemple ci-dessous :",
    'errors.invalidConfigFile': 'Fichier de configuration non valide',
    'errors.invalidConfigMessage':
      "Échec du chargement de « extensions.installation.saveToSingleFile.file ». {{message}}. Fournissez une configuration d'installation valide si vous souhaitez activer cet outil. Modifiez votre fichier dynamic-plugins.yaml comme indiqué dans l'exemple ci-dessous :",
    'errors.missingConfigFile': 'Fichier de configuration manquant',
    'errors.missingConfigMessage':
      "{{message}}. Vous devez l'ajouter à votre app-config.yaml si vous souhaitez activer cet outil. Modifiez le fichier app-config.yaml comme indiqué dans l'exemple ci-dessous :",
    'errors.unknownError':
      'Erreur lors de la lecture du fichier de configuration. ',
    'header.catalog': 'Catalogue',
    'header.collectionsPage': 'Collections',
    'header.extensions': 'Extensions',
    'header.installedPackages': 'Paquets installés',
    'header.installedPackagesWithCount': 'Paquets installés ({{count}})',
    'header.packagesPage': 'Packages',
    'header.pluginsPage': 'Plugins',
    'header.title': 'Extensions',
    'install.aboutPlugin': 'À propos du plugin',
    'install.allPackages': 'Tous les paquets',
    'install.back': 'Arrière',
    'install.cancel': 'Annuler',
    'install.configurationRequired': 'Configuration requise',
    'install.customConfiguration': 'Configuration personnalisée',
    'install.download': 'Télécharger',
    'install.editInstructions': 'Modifier les instructions',
    'install.error': "Échec de l'installation du plugin",
    'install.errors.failedToSave': 'Échec de la sauvegarde',
    'install.errors.missingPackageField':
      "Contenu de l'éditeur non valide : champ « package » manquant dans l'élément",
    'install.errors.missingPackageItem':
      "Contenu de l'éditeur non valide : élément de package manquant",
    'install.errors.missingPluginsList':
      "Contenu de l'éditeur non valide : liste des « plugins » manquante",
    'install.examples': 'Exemples',
    'install.installBackend': 'Installer le plugin back-end',
    'install.installFrontend': 'Installer le plugin frontal',
    'install.installProgress': 'Installation...',
    'install.installTemplates': 'Installer des modèles de logiciels',
    'install.installationInstructions': "Instructions d'installation",
    'install.instructions': 'Instructions',
    'install.optional': 'Facultatif',
    'install.packageUpdated': 'Paquet mis à jour',
    'install.packageEnabled': 'Paquet activé',
    'install.packageDisabled': 'Paquet désactivé',
    'install.pluginInstalled': 'Plugin installé',
    'install.pluginTabs': 'Onglets de plugins',
    'install.pluginUpdated': 'Plugin mis à jour',
    'install.required': 'Requis',
    'install.reset': 'Réinitialiser',
    'install.selectPackages': 'Sélectionnez les packages à installer',
    'install.settingUpPlugin': 'Configuration du plugin',
    'install.success': 'Plugin installé avec succès',
    'install.title': 'Installer le plugin',
    'installedPackages.table.columns.actions': 'Actes',
    'installedPackages.table.columns.name': 'Nom',
    'installedPackages.table.columns.packageName': 'nom du package npm',
    'installedPackages.table.columns.role': 'Rôle',
    'installedPackages.table.columns.version': 'Version',
    'installedPackages.table.emptyMessages.noRecords':
      'Aucun enregistrement à afficher',
    'installedPackages.table.emptyMessages.noResults':
      'Aucun résultat trouvé. Essayez un autre terme de recherche.',
    'installedPackages.table.searchPlaceholder': 'Rechercher',
    'installedPackages.table.title': 'Paquets installés ({{count}})',
    'installedPackages.table.tooltips.packageProductionDisabled':
      "Le paquet ne peut pas être géré dans l'environnement de production.",
    'installedPackages.table.tooltips.enableActions':
      'Pour activer les actions, ajoutez une entité de catalogue pour ce package',
    'installedPackages.table.tooltips.noDownloadPermissions':
      "Vous n'avez pas la permission de télécharger la configuration. Contactez votre administrateur pour demander un accès ou une assistance.",
    'installedPackages.table.tooltips.noEditPermissions':
      "Vous n'avez pas la permission de modifier la configuration. Contactez votre administrateur pour demander un accès ou une assistance.",
    'installedPackages.table.tooltips.noTogglePermissions':
      "Vous n'avez pas la permission d'activer ou de désactiver les paquets. Contactez votre administrateur pour demander un accès ou une assistance.",
    'installedPackages.table.tooltips.editPackage':
      'Modifier la configuration du paquet',
    'installedPackages.table.tooltips.downloadPackage':
      'Télécharger la configuration du paquet',
    'installedPackages.table.tooltips.enablePackage': 'Activer le paquet',
    'installedPackages.table.tooltips.disablePackage': 'Désactiver le paquet',
    loading: 'Chargement en cours...',
    'metadata.about': 'À propos',
    'metadata.by': ' par ',
    'metadata.highlights': 'Points forts',
    'metadata.pluginNotFound': 'Plugin {{name}} non trouvé !',
    'metadata.publisher': 'Éditeur',
    'metadata.supportProvider': 'Fournisseur de support',
    'metadata.entryName': "Nom d'entrée",
    'metadata.bySomeone': "par quelqu'un",
    'metadata.category': 'Catégorie',
    'metadata.versions': 'Versions',
    'package.about': 'À propos',
    'package.author': 'Auteur:',
    'package.backstageRole': 'Rôle backstage:',
    'package.dynamicPluginPath': 'Chemin du plugin dynamique :',
    'package.highlights': 'Points forts',
    'package.lifecycle': 'Cycle de vie:',
    'package.name': 'Nom du package :',
    'package.notFound': 'Paquet {{namespace}}/{{name}} introuvable !',
    'package.support': 'Support:',
    'package.supportedVersions': 'Versions prises en charge :',
    'package.version': 'Version:',
    'plugin.author': 'Auteur',
    'plugin.authors': 'Auteurs',
    'plugin.configuration': 'Configuration',
    'plugin.dependencies': 'Dépendances',
    'plugin.description': 'Description',
    'plugin.documentation': 'Documentation',
    'plugin.installation': 'Installation',
    'plugin.license': 'Licence',
    'plugin.repository': 'Dépôt',
    'plugin.tags': 'Mots-clés',
    'plugin.version': 'Version',
    retry: 'Réessayer',
    'role.backend': 'Backend',
    'role.backendModule': 'Module backend',
    'role.frontend': "L'extrémité avant",
    'search.author': 'Auteur',
    'search.category': 'Catégorie',
    'search.clear': 'Effacer la recherche',
    'search.clearFilter': 'Effacer le filtre',
    'search.clearFilters': 'Effacer les filtres',
    'search.filter': 'Filtre',
    'search.filterBy': 'Filtrer par',
    'search.noResults':
      'Aucun plugin ne correspond à vos critères de recherche',
    'search.noResultsFound':
      'Aucun résultat trouvé. Ajustez vos filtres et réessayez.',
    'search.placeholder': 'Rechercher',
    'search.supportType': 'Type de support',
    'status.disabled': 'Désactivé',
    'status.installed': 'Installé',
    'status.notInstalled': 'Non installé',
    'status.partiallyInstalled': 'Partiellement installé',
    'status.updateAvailable': 'Mise à jour disponible',
    'supportTypes.certifiedBy': 'Certifié par {{value}} ({{count}})',
    'supportTypes.customPlugins': 'Plugins personnalisés ({{count}})',
    'supportTypes.verifiedBy': 'Vérifié par {{value}} ({{count}})',
    'table.action': 'Action',
    'table.description': 'Description',
    'table.name': 'Nom',
    'table.packageName': 'Nom du package',
    'table.packages': 'Packages',
    'table.packagesCount': 'Paquets ({{count}})',
    'table.plugins': 'Plugins',
    'table.pluginsCount': 'Plugins ({{count}})',
    'table.pluginsTable': 'Tableau des plugins',
    'table.role': 'Rôle',
    'table.status': 'Statut',
    'table.supportedVersion': 'Version prise en charge',
    'table.version': 'Version',
    'table.versions': 'Versions',
    'tooltips.extensionsDisabled':
      "L'installation du plugin est désactivée. Pour l'activer, mettez à jour la configuration de vos extensions dans votre fichier app-config.yaml.",
    'tooltips.noPermissions':
      "Vous n'avez pas l'autorisation d'installer des plugins ou d'afficher leurs configurations. Contactez votre administrateur pour demander un accès ou une assistance.",
    'tooltips.productionDisabled':
      "L'installation du plugin est désactivée dans l'environnement de production.",
  },
});

export default marketplaceTranslationFr;
