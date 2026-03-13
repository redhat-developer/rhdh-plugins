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
import { extensionsTranslationRef } from './ref';

/**
 * de translation for plugin.extensions.
 * @public
 */
const extensionsTranslationDe = createTranslationMessages({
  ref: extensionsTranslationRef,
  messages: {
    'header.title': 'Erweiterungen',
    'header.extensions': 'Erweiterungen',
    'header.catalog': 'Katalog',
    'header.installedPackages': 'Installierte Pakete',
    'header.installedPackagesWithCount': 'Installierte Pakete ({{count}})',
    'header.packagesPage': 'Pakete',
    'header.collectionsPage': 'Sammlungen',
    'button.install': 'Installieren',
    'button.uninstall': 'Deinstallieren',
    'button.enable': 'Aktivieren',
    'button.disable': 'Deaktivieren',
    'button.update': 'Aktualisieren',
    'button.save': 'Speichern',
    'button.close': 'Schließen',
    'button.viewAll': 'Alle Plugins anzeigen',
    'button.viewDocumentation': 'Dokumentation anzeigen',
    'button.viewInstalledPlugins': 'Installierte Plugins ({{count}}) anzeigen',
    'status.notInstalled': 'Nicht installiert',
    'status.installed': 'Installiert',
    'status.disabled': 'Deaktiviert',
    'status.partiallyInstalled': 'Teilweise installiert',
    'status.updateAvailable': 'Update verfügbar',
    'role.backend': 'Backend',
    'role.backendModule': 'Backend-Modul',
    'role.frontend': 'Frontend',
    'emptyState.noPluginsFound': 'Keine Plugins gefunden',
    'emptyState.mustEnableBackend':
      "Backend-Plugin 'Erweiterungen' muss aktiviert werden.",
    'emptyState.noPluginsDescription':
      'Beim Laden der Plugins ist ein Fehler aufgetreten. Überprüfen Sie die Konfiguration, oder lesen Sie die Plugin-Dokumentation, um das Problem zu beheben. Sie können sich auch andere verfügbare Plugins ansehen.',
    'emptyState.configureBackend':
      "Konfigurieren Sie das Plugin '@red-hat-developer-hub/backstage-plugin-extensions-backend'.",
    'alert.productionDisabled':
      'Die Plugin-Installation ist in der Produktionsumgebung deaktiviert.',
    'alert.installationDisabled': 'Die Plugin-Installation ist deaktiviert.',
    'alert.missingDynamicArtifact':
      'Dieses Paket kann nicht verwaltet werden. Um Aktionen zu ermöglichen, muss ein Katalogelement mit dem erforderlichen **spec.dynamicArtifact** hinzugefügt werden.',
    'alert.missingDynamicArtifactForPlugin':
      'Dieses Plugin kann nicht verwaltet werden. Um Aktionen zu ermöglichen, muss allen zugehörigen Paketen ein Katalogelement mit dem erforderlichen **spec.dynamicArtifact** hinzugefügt werden.',
    'alert.extensionsExample':
      'Um dies zu aktivieren, fügen Sie die Erweiterungskonfiguration in Ihrer Konfigurationsdatei für dynamische Plugins hinzu oder ändern Sie sie.',
    'alert.backendRestartRequired': 'Neustart des Backends erforderlich',
    'alert.viewPlugins': 'Plugins anzeigen',
    'alert.viewPackages': 'Pakete anzeigen',
    'search.placeholder': 'Suchen',
    'search.clear': 'Suche löschen',
    'search.filter': 'Filter',
    'search.clearFilter': 'Filter löschen',
    'search.category': 'Kategorie',
    'search.author': 'Autor',
    'search.supportType': 'Typ der Unterstützung',
    'search.noResults': 'Keine Plugins entsprechen Ihren Suchkriterien',
    'search.filterBy': 'Filtern nach',
    'search.clearFilters': 'Filter löschen',
    'search.noResultsFound':
      'Keine Ergebnisse gefunden. Passen Sie Ihre Filter an, und versuchen Sie es erneut.',
    'common.links': 'Verknüpfungen',
    'common.by': ' von ',
    'common.comma': ', ',
    'common.readMore': 'Mehr lesen',
    'common.close': 'Schließen',
    'common.apply': 'Anwenden',
    'common.couldNotApplyYaml':
      'YAML konnte nicht angewendet werden: {{error}}',
    'package.name': 'Paketname:',
    'package.version': 'Version:',
    'package.dynamicPluginPath': 'Dynamischer Plugin-Pfad:',
    'package.backstageRole': 'Backstage-Rolle:',
    'package.supportedVersions': 'Unterstützte Versionen:',
    'package.author': 'Autor:',
    'package.support': 'Unterstützung:',
    'package.lifecycle': 'Lifecycle:',
    'package.highlights': 'Highlights',
    'package.about': 'Info',
    'package.notFound': 'Paket {{namespace}}/{{name}} nicht gefunden!',
    'package.ensureCatalogEntity':
      'Stellen Sie sicher, dass für dieses Paket ein Katalogelement existiert.',
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
    'installedPackages.table.title': 'Installierte Pakete ({{count}})',
    'installedPackages.table.columns.name': 'Name',
    'installedPackages.table.columns.packageName': 'npm-Paketname',
    'installedPackages.table.columns.role': 'Rolle',
    'installedPackages.table.columns.version': 'Version',
    'installedPackages.table.columns.actions': 'Aktionen',
    'installedPackages.table.tooltips.packageProductionDisabled':
      'Das Paket kann in der Produktionsumgebung nicht verwaltet werden.',
    'installedPackages.table.tooltips.installationDisabled':
      'Das Paket kann nicht verwaltet werden, da die Plugin-Installation deaktiviert ist. Um dies zu aktivieren, fügen Sie die Erweiterungskonfiguration in Ihrer Konfigurationsdatei für dynamische Plugins hinzu oder ändern Sie sie.',
    'installedPackages.table.tooltips.noDownloadPermissions':
      'Sie haben keine Berechtigung, die Konfiguration herunterzuladen. Wenden Sie sich an den Administrator, um Zugriff oder Unterstützung anzufordern.',
    'installedPackages.table.tooltips.noEditPermissions':
      'Sie haben keine Berechtigung, die Konfiguration zu bearbeiten. Wenden Sie sich an den Administrator, um Zugriff oder Unterstützung anzufordern.',
    'installedPackages.table.tooltips.noTogglePermissions':
      'Sie haben keine Berechtigung, Pakete zu aktivieren oder zu deaktivieren. Wenden Sie sich an den Administrator, um Zugriff oder Unterstützung anzufordern.',
    'installedPackages.table.tooltips.editPackage':
      'Paketkonfiguration bearbeiten',
    'installedPackages.table.tooltips.downloadPackage':
      'Paketkonfiguration herunterladen',
    'installedPackages.table.tooltips.enablePackage': 'Paket aktivieren',
    'installedPackages.table.tooltips.disablePackage': 'Paket deaktivieren',
    'installedPackages.table.emptyMessages.noResults':
      'Keine Ergebnisse gefunden. Versuchen Sie es mit einem anderen Suchbegriff.',
    'installedPackages.table.emptyMessages.noRecords':
      'Keine Datensätze zum Anzeigen vorhanden',
    'actions.install': 'Installieren',
    'actions.view': 'Anzeigen',
    'actions.edit': 'Bearbeiten',
    'actions.enable': 'Aktivieren',
    'actions.disable': 'Deaktivieren',
    'actions.actions': 'Aktionen',
    'actions.editConfiguration': 'Bearbeiten',
    'actions.pluginConfigurations': 'Plugin-Konfigurationen',
    'actions.packageConfiguration': 'Paketkonfiguration',
    'actions.pluginCurrentlyEnabled': 'Plugin derzeit aktiviert',
    'actions.pluginCurrentlyDisabled': 'Plugin derzeit deaktiviert',
    'actions.packageCurrentlyEnabled': 'Paket derzeit aktiviert',
    'actions.packageCurrentlyDisabled': 'Paket derzeit deaktiviert',
    'actions.installTitle': '{{displayName}} installieren',
    'metadata.by': ' von ',
    'metadata.comma': ', ',
    'metadata.ensureCatalogEntityPlugin':
      'Stellen Sie sicher, dass für dieses Plugin ein Katalogelement existiert.',
    'metadata.highlights': 'Highlights',
    'metadata.about': 'Info',
    'metadata.publisher': 'Herausgeber',
    'metadata.supportProvider': 'Support-Provider',
    'metadata.entryName': 'Eintragsname',
    'metadata.bySomeone': 'von jemandem',
    'metadata.category': 'Kategorie',
    'metadata.versions': 'Versionen',
    'metadata.backstageCompatibility': 'Backstage-Kompatibilitätsversion',
    'supportTypes.certifiedBy': 'Zertifiziert von {{value}} ({{count}})',
    'install.title': 'Plugin installieren',
    'install.configurationRequired': 'Konfiguration erforderlich',
    'install.optional': 'Optional',
    'install.required': 'Erforderlich',
    'install.selectPackages': 'Wählen Sie die zu installierenden Pakete aus',
    'install.allPackages': 'Alle Pakete',
    'install.customConfiguration': 'Benutzerdefinierte Konfiguration',
    'install.installProgress': 'Installation läuft...',
    'install.success': 'Plugin erfolgreich installiert',
    'install.error': 'Plugin konnte nicht installiert werden',
    'install.installFrontend': 'Frontend-Plugin installieren',
    'install.installBackend': 'Backend-Plugin installieren',
    'install.installTemplates': 'Software-Templates installieren',
    'install.installationInstructions': 'Installationsanweisungen',
    'install.download': 'Herunterladen',
    'install.examples': 'Beispiele',
    'install.cancel': 'Abbrechen',
    'install.reset': 'Zurücksetzen',
    'install.pluginTabs': 'Plugin-Registerkarten',
    'install.settingUpPlugin': 'Plugin wird eingerichtet',
    'install.aboutPlugin': 'Über das Plugin',
    'install.pluginUpdated': 'Plugin aktualisiert',
    'install.pluginInstalled': 'Plugin installiert',
    'install.instructions': 'Anweisungen',
    'install.editInstructions': 'Bearbeitungsanweisungen',
    'install.back': 'Zurück',
    'install.packageUpdated': 'Paket aktualisiert',
    'install.packageEnabled': 'Paket aktiviert',
    'install.packageDisabled': 'Paket deaktiviert',
    'install.pluginEnabled': 'Plugin aktiviert',
    'install.pluginDisabled': 'Plugin deaktiviert',
    'install.errors.missingPluginsList':
      "Ungültiger Editorinhalt: 'Plugins'-Liste fehlt.",
    'install.errors.missingPackageItem':
      'Ungültiger Editorinhalt: Paketelement fehlt',
    'install.errors.missingPackageField':
      "Ungültiger Editorinhalt: 'Paket'-Feld fehlt im Element",
    'install.errors.failedToSave': 'Speichern fehlgeschlagen',
    loading: 'Ladevorgang läuft...',
    error: 'Es ist ein Fehler aufgetreten',
    retry: 'Wiederholen',
    'errors.missingConfigFile': 'Fehlende Konfigurationsdatei',
    'errors.missingConfigMessage':
      "{{message}}. Sie müssen es Ihrer 'app-config.yaml'-Datei hinzufügen, wenn Sie dieses Tool aktivieren möchten. Bearbeiten Sie die 'app-config.yaml'-Datei wie im Beispiel unten gezeigt:",
    'errors.invalidConfigFile': 'Ungültige Konfigurationsdatei',
    'errors.invalidConfigMessage':
      "Die Datei 'extensions.installation.saveToSingleFile.file' konnte nicht geladen werden. {{message}}. Geben Sie eine gültige Installationskonfiguration an, wenn Sie dieses Tool aktivieren möchten. Bearbeiten Sie Ihre 'dynamic-plugins.yaml'-Datei wie im Beispiel unten gezeigt:",
    'errors.fileNotExists':
      'Die Konfigurationsdatei ist fehlerhaft, falsch geschrieben oder existiert nicht.',
    'errors.fileNotExistsMessage':
      "{{message}}. Überprüfen Sie den angegebenen Dateinamen in Ihrer 'app-config.yaml'-Datei, wenn Sie dieses Tool wie im folgenden Beispiel gezeigt aktivieren möchten:",
    'errors.unknownError': 'Fehler beim Lesen der Konfigurationsdatei. ',
    'tooltips.productionDisabled':
      'Die Plugin-Installation ist in der Produktionsumgebung deaktiviert.',
    'tooltips.extensionsDisabled':
      'Die Plugin-Installation ist deaktiviert. Um dies zu aktivieren, fügen Sie die Erweiterungskonfiguration in Ihrer Konfigurationsdatei für dynamische Plugins hinzu oder ändern Sie sie.',
  },
});

export default extensionsTranslationDe;
