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

const marketplaceTranslationDe = createTranslationMessages({
  ref: marketplaceTranslationRef,
  messages: {
    // Page headers and titles
    'header.title': 'Erweiterungen',
    'header.pluginsPage': 'Plugins',
    'header.packagesPage': 'Pakete',
    'header.collectionsPage': 'Sammlungen',

    // Navigation and buttons
    'button.install': 'Installieren',
    'button.uninstall': 'Deinstallieren',
    'button.enable': 'Aktivieren',
    'button.disable': 'Deaktivieren',
    'button.update': 'Aktualisieren',
    'button.save': 'Speichern',
    'button.close': 'Schließen',
    'button.viewAll': 'Alle Plugins anzeigen',
    'button.viewDocumentation': 'Dokumentation anzeigen',
    'button.viewInstalledPlugins': 'Installierte Plugins anzeigen ({{count}})',
    'button.restart': 'Neustart erforderlich',

    // Status labels
    'status.notInstalled': 'Nicht installiert',
    'status.installed': 'Installiert',
    'status.disabled': 'Deaktiviert',
    'status.partiallyInstalled': 'Teilweise installiert',
    'status.updateAvailable': 'Update verfügbar',

    // Role labels
    'role.backend': 'Backend',
    'role.backendModule': 'Backend-Modul',
    'role.frontend': 'Frontend',

    // Empty states and errors
    'emptyState.noPluginsFound': 'Keine Plugins gefunden',
    'emptyState.mustEnableBackend':
      'Extensions-Backend-Plugin muss aktiviert werden',
    'emptyState.noPluginsDescription':
      'Beim Laden der Plugins ist ein Fehler aufgetreten. Überprüfen Sie Ihre Konfiguration oder lesen Sie die Plugin-Dokumentation. Sie können auch andere verfügbare Plugins erkunden.',
    'emptyState.configureBackend':
      "Konfigurieren Sie das '@red-hat-developer-hub/backstage-plugin-marketplace-backend' Plugin.",

    // Alerts and warnings
    'alert.productionDisabled':
      'Plugin-Installation ist in der Produktionsumgebung deaktiviert.',
    'alert.installationDisabled': 'Plugin-Installation ist deaktiviert.',
    'alert.extensionsExample':
      'Beispiel zur Aktivierung der Extensions-Plugin-Installation',
    'alert.singlePluginRestart':
      'Das **{{pluginName}}** Plugin erfordert einen Neustart des Backend-Systems, um die Installation, Aktualisierung, Aktivierung oder Deaktivierung abzuschließen.',
    'alert.multiplePluginRestart':
      'Sie haben **{{count}}** Plugins, die einen Neustart Ihres Backend-Systems erfordern, um die Installation, Aktualisierung, Aktivierung oder Deaktivierung abzuschließen.',
    'alert.restartRequired': '{{count}} Plugins installiert',
    'alert.backendRestartRequired': 'Backend-Neustart erforderlich',
    'alert.viewPlugins': 'Plugins anzeigen',

    // Search and filtering
    'search.placeholder': 'Plugins suchen...',
    'search.clear': 'Suche löschen',
    'search.filter': 'Filtern',
    'search.clearFilter': 'Filter löschen',
    'search.noResults': 'Keine Plugins entsprechen Ihren Suchkriterien',
    'search.filterBy': 'Filtern nach',
    'search.clearFilters': 'Filter löschen',
    'search.noResultsFound':
      'Keine Ergebnisse gefunden. Passen Sie Ihre Filter an und versuchen Sie es erneut.',
    'search.category': 'Kategorie',
    'search.author': 'Autor',
    'search.supportType': 'Support-Typ',

    // General UI text
    'common.links': 'Links',
    'common.by': ' von ',
    'common.comma': ', ',
    'common.noDescriptionAvailable': 'keine Beschreibung verfügbar',
    'common.readMore': 'Mehr lesen',
    'common.close': 'Schließen',
    'common.apply': 'Anwenden',
    'common.couldNotApplyYaml':
      'YAML konnte nicht angewendet werden: {{error}}',

    // Dialogs
    'dialog.backendRestartRequired': 'Backend-Neustart erforderlich',
    'dialog.restartMessage':
      'Um die Plugin-Änderungen abzuschließen, starten Sie Ihr Backend-System neu.',

    // Plugin details
    'plugin.description': 'Beschreibung',
    'plugin.documentation': 'Dokumentation',
    'plugin.repository': 'Repository',
    'plugin.license': 'Lizenz',
    'plugin.version': 'Version',
    'plugin.author': 'Autor',
    'plugin.tags': 'Tags',
    'plugin.dependencies': 'Abhängigkeiten',
    'plugin.configuration': 'Konfiguration',
    'plugin.installation': 'Installation',

    // Package details
    'package.name': 'Paketname:',
    'package.version': 'Version:',
    'package.dynamicPluginPath': 'Dynamischer Plugin-Pfad:',
    'package.backstageRole': 'Backstage-Rolle:',
    'package.supportedVersions': 'Unterstützte Versionen:',
    'package.author': 'Autor:',
    'package.support': 'Support:',
    'package.lifecycle': 'Lebenszyklus:',
    'package.highlights': 'Highlights',
    'package.about': 'Über',
    'package.notFound': 'Paket {{namespace}}/{{name}} nicht gefunden!',

    // Tables and lists
    'table.packageName': 'Paketname',
    'table.version': 'Version',
    'table.role': 'Rolle',
    'table.supportedVersion': 'Unterstützte Version',
    'table.status': 'Status',
    'table.name': 'Name',
    'table.action': 'Aktion',
    'table.description': 'Beschreibung',
    'table.versions': 'Versionen',
    'table.plugins': 'Plugins',
    'table.packages': 'Pakete',
    'table.pluginsCount': 'Plugins ({{count}})',
    'table.packagesCount': 'Pakete ({{count}})',
    'table.pluginsTable': 'Plugins-Tabelle',

    // Plugin actions and states
    'actions.install': 'Installieren',
    'actions.view': 'Anzeigen',
    'actions.edit': 'Bearbeiten',
    'actions.enable': 'Aktivieren',
    'actions.disable': 'Deaktivieren',
    'actions.actions': 'Aktionen',
    'actions.editConfiguration': 'Bearbeiten',
    'actions.pluginConfigurations': 'Plugin-Konfigurationen',
    'actions.pluginCurrentlyEnabled': 'Plugin ist derzeit aktiviert',
    'actions.pluginCurrentlyDisabled': 'Plugin ist derzeit deaktiviert',
    'actions.installTitle': '{{displayName}} installieren',
    'actions.editTitle': '{{displayName}} Konfigurationen bearbeiten',

    // Plugin metadata
    'metadata.by': ' von ',
    'metadata.pluginNotFound': 'Plugin {{name}} nicht gefunden!',
    'metadata.highlights': 'Highlights',
    'metadata.about': 'Über',

    // Support type filters
    'supportTypes.certifiedBy': 'Zertifiziert von {{value}} ({{count}})',
    'supportTypes.verifiedBy': 'Verifiziert von {{value}} ({{count}})',
    'supportTypes.customPlugins': 'Benutzerdefinierte Plugins ({{count}})',

    // Collections
    'collection.featured': 'Empfohlen',
    'collection.kubernetes': 'Kubernetes',
    'collection.monitoring': 'Überwachung',
    'collection.security': 'Sicherheit',
    'collection.viewMore': 'Mehr anzeigen',
    'collection.pluginCount': '{{count}} Plugins',

    // Installation and configuration
    'install.title': 'Plugin installieren',
    'install.configurationRequired': 'Konfiguration erforderlich',
    'install.optional': 'Optional',
    'install.required': 'Erforderlich',
    'install.selectPackages': 'Pakete zur Installation auswählen',
    'install.allPackages': 'Alle Pakete',
    'install.customConfiguration': 'Benutzerdefinierte Konfiguration',
    'install.installProgress': 'Installiere...',
    'install.success': 'Plugin erfolgreich installiert',
    'install.error': 'Plugin-Installation fehlgeschlagen',
    'install.installFrontend': 'Frontend-Plugin installieren',
    'install.installBackend': 'Backend-Plugin installieren',
    'install.installTemplates': 'Software-Vorlagen installieren',
    'install.installationInstructions': 'Installationsanweisungen',
    'install.download': 'Herunterladen',
    'install.examples': 'Beispiele',
    'install.cancel': 'Abbrechen',
    'install.reset': 'Zurücksetzen',
    'install.pluginTabs': 'Plugin-Tabs',
    'install.settingUpPlugin': 'Plugin einrichten',
    'install.aboutPlugin': 'Über das Plugin',
    'install.pluginUpdated': 'Plugin aktualisiert',
    'install.pluginInstalled': 'Plugin installiert',
    'install.instructions': 'Anweisungen',
    'install.editInstructions': 'Anweisungen bearbeiten',
    'install.back': 'Zurück',

    // Loading and error states
    loading: 'Laden...',
    error: 'Ein Fehler ist aufgetreten',
    retry: 'Wiederholen',

    // Error messages
    'errors.missingConfigFile': 'Fehlende Konfigurationsdatei',
    'errors.missingConfigMessage':
      '{{message}}. Sie müssen es zu Ihrer app-config.yaml hinzufügen, wenn Sie dieses Tool aktivieren möchten. Bearbeiten Sie die app-config.yaml-Datei wie im folgenden Beispiel gezeigt:',
    'errors.invalidConfigFile': 'Ungültige Konfigurationsdatei',
    'errors.invalidConfigMessage':
      "Fehler beim Laden von 'extensions.installation.saveToSingleFile.file'. {{message}}. Geben Sie eine gültige Installationskonfiguration an, wenn Sie dieses Tool aktivieren möchten. Bearbeiten Sie Ihre dynamic-plugins.yaml-Datei wie im folgenden Beispiel gezeigt:",
    'errors.fileNotExists':
      'Konfigurationsdatei ist falsch, falsch geschrieben oder existiert nicht',
    'errors.fileNotExistsMessage':
      '{{message}}. Bitte überprüfen Sie den angegebenen Dateinamen in Ihrer app-config.yaml, wenn Sie dieses Tool aktivieren möchten, wie im folgenden Beispiel hervorgehoben:',
    'errors.unknownError': 'Fehler beim Lesen der Konfigurationsdatei. ',

    // Tooltip messages
    'tooltips.productionDisabled':
      'Plugin-Installation ist in der Produktionsumgebung deaktiviert.',
    'tooltips.extensionsDisabled':
      'Plugin-Installation ist deaktiviert. Um es zu aktivieren, aktualisieren Sie Ihre Erweiterungskonfiguration in Ihrer app-config.yaml-Datei.',
    'tooltips.noPermissions':
      'Sie haben keine Berechtigung, Plugins zu installieren oder deren Konfigurationen anzuzeigen. Wenden Sie sich an Ihren Administrator, um Zugriff oder Unterstützung anzufordern.',

    // Accessibility
    'aria.openPlugin': 'Plugin {{name}} öffnen',
    'aria.closeDialog': 'Dialog schließen',
    'aria.expandSection': 'Bereich erweitern',
    'aria.collapseSection': 'Bereich einklappen',
    'aria.sortBy': 'Sortieren nach {{field}}',
    'aria.filterBy': 'Filtern nach {{field}}',
    'badges.certified': 'Zertifiziert',
    'badges.certifiedBy': 'Zertifiziert von {{provider}}',
    'badges.verified': 'Verifiziert',
    'badges.verifiedBy': 'Verifiziert von {{provider}}',
    'badges.customPlugin': 'Benutzerdefiniertes Plugin',
  },
});

export default marketplaceTranslationDe;
