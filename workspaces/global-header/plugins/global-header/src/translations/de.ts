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

/**
 * de translation for plugin.global-header.
 * @public
 */
const globalHeaderTranslationDe = createTranslationMessages({
  ref: globalHeaderTranslationRef,
  messages: {
    'help.tooltip': 'Hilfe',
    'help.noSupportLinks': 'Keine Supportverknüpfungen',
    'help.noSupportLinksSubtitle':
      'Supportverknüpfungen müssen vom Administrator eingerichtet werden.',
    'help.quickStart': 'Schnellstart',
    'help.supportTitle': 'Support',
    'profile.picture': 'Profilbild',
    'profile.settings': 'Einstellungen',
    'profile.myProfile': 'Mein Profil',
    'profile.signOut': 'Abmelden',
    'search.placeholder': 'Suchen...',
    'search.noResults': 'Keine Ergebnisse gefunden',
    'search.errorFetching': 'Fehler beim Abrufen der Ergebnisse',
    'search.allResults': 'Alle Ergebnisse',
    'search.clear': 'Löschen',
    'applicationLauncher.tooltip': 'Anwendungsstartprogramm',
    'applicationLauncher.noLinksTitle':
      'Keine Anwendungsverknüpfungen konfiguriert',
    'applicationLauncher.noLinksSubtitle':
      'Konfigurieren Sie Anwendungsverknüpfungen in der Konfiguration für dynamische Plugins, um von hier aus schnell darauf zugreifen zu können.',
    'applicationLauncher.developerHub': 'Developer Hub',
    'applicationLauncher.rhdhLocal': 'RHDH lokal',
    'applicationLauncher.sections.documentation': 'Dokumentation',
    'applicationLauncher.sections.developerTools': 'Entwicklertools',
    'starred.title': 'Ihre mit Sternchen gekennzeichneten Elemente',
    'starred.removeTooltip': 'Aus der Liste entfernen',
    'starred.noItemsTitle':
      'Noch keine mit Sternchen gekennzeichneten Elemente',
    'starred.noItemsSubtitle':
      'Klicken Sie auf das Sternsymbol neben dem Namen einer Entity, um sie hier für den Schnellzugriff zu speichern.',
    'notifications.title': 'Benachrichtigungen',
    'notifications.unsupportedDismissOption':
      'Verwerfen-Option „{{option}}“ nicht unterstützt; derzeit werden „none“, „session“ oder „localstorage“ unterstützt!',
  },
});

export default globalHeaderTranslationDe;
