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
import { globalHeaderTranslationRef } from './ref';

const globalHeaderTranslationDe = createTranslationMessages({
  ref: globalHeaderTranslationRef,
  messages: {
    'help.tooltip': 'Hilfe',
    'help.noSupportLinks': 'Keine Support-Links',
    'help.noSupportLinksSubtitle':
      'Ihr Administrator muss Support-Links einrichten.',
    'help.quickStart': 'Schnellstart',
    'help.supportTitle': 'Support',
    'profile.picture': 'Profilbild',
    'profile.signOut': 'Abmelden',
    'search.placeholder': 'Suchen...',
    'search.noResults': 'Keine Ergebnisse gefunden',
    'search.errorFetching': 'Fehler beim Abrufen der Ergebnisse',
    'applicationLauncher.tooltip': 'Anwendungs-Starter',
    'applicationLauncher.noLinksTitle': 'Keine Anwendungslinks konfiguriert',
    'applicationLauncher.noLinksSubtitle':
      'Konfigurieren Sie Anwendungslinks in der dynamischen Plugin-Konfiguration für schnellen Zugriff von hier aus.',
    'starred.title': 'Ihre markierten Elemente',
    'starred.removeTooltip': 'Aus Liste entfernen',
    'starred.noItemsTitle': 'Noch keine markierten Elemente',
    'starred.noItemsSubtitle':
      'Klicken Sie auf das Stern-Symbol neben dem Namen einer Entität, um sie hier für schnellen Zugriff zu speichern.',
    'notifications.title': 'Benachrichtigungen',
    'notifications.unsupportedDismissOption':
      'Nicht unterstützte Dismiss-Option "{{option}}", derzeit unterstützt "none", "session" oder "localstorage"!',
    'create.title': 'Selbstbedienung',
    'create.registerComponent.title': 'Eine Komponente registrieren',
    'create.registerComponent.subtitle': 'In die Katalogseite importieren',
    'create.templates.sectionTitle': 'Eine Vorlage verwenden',
    'create.templates.allTemplates': 'Alle Vorlagen',
    'create.templates.errorFetching': 'Fehler beim Abrufen der Vorlagen',
    'create.templates.noTemplatesAvailable': 'Keine Vorlagen verfügbar',
    'profile.settings': 'Einstellungen',
    'profile.myProfile': 'Mein Profil',
    'applicationLauncher.developerHub': 'Developer Hub',
    'applicationLauncher.rhdhLocal': 'RHDH Lokal',
    'applicationLauncher.sections.documentation': 'Dokumentation',
    'applicationLauncher.sections.developerTools': 'Entwickler-Tools',
  },
});

export default globalHeaderTranslationDe;
