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
import { quickstartTranslationRef } from './ref';

const quickstartTranslationDe = createTranslationMessages({
  ref: quickstartTranslationRef,
  messages: {
    'header.title': 'Erste Schritte mit dem Developer Hub',
    'header.subtitle': 'Wir führen Sie durch einige schnelle Schritte',
    'button.quickstart': 'Schnellstart',
    'button.openQuickstartGuide': 'Schnellstart-Leitfaden öffnen',
    'button.closeDrawer': 'Drawer schließen',
    'footer.progress': '{{progress}}% Fortschritt',
    'footer.notStarted': 'Nicht begonnen',
    'footer.hide': 'Ausblenden',
    'content.emptyState.title':
      'Schnellstart-Inhalte sind für Ihre Rolle nicht verfügbar.',
    'item.expandAriaLabel': '{{title}} Details erweitern',
    'item.collapseAriaLabel': '{{title}} Details einklappen',
    'item.expandButtonAriaLabel': 'Element erweitern',
    'item.collapseButtonAriaLabel': 'Element einklappen',
    'dev.pageTitle': 'Quickstart Plugin Testseite',
    'dev.pageDescription':
      'Dies ist eine Testseite für das Quickstart-Plugin. Verwenden Sie die Schaltflächen unten, um mit dem Quickstart-Drawer zu interagieren.',
    'dev.drawerControls': 'Drawer-Steuerungen',
    'dev.currentState': 'Aktueller Drawer-Status: {{state}}',
    'dev.stateOpen': 'Offen',
    'dev.stateClosed': 'Geschlossen',
    'dev.instructions': 'Anweisungen',
    'dev.step1':
      '1. Klicken Sie auf "Schnellstart-Leitfaden öffnen", um den Drawer zu öffnen',
    'dev.step2': '2. Navigieren Sie durch die Schnellstart-Schritte',
    'dev.step3':
      '3. Testen Sie die Fortschrittsverfolgung durch Abschließen von Schritten',
    'dev.step4':
      '4. Der Drawer kann mit der Schließen-Schaltfläche oder den eigenen Steuerelementen des Drawers geschlossen werden',
    'dev.step5':
      '5. Der Fortschritt wird automatisch in localStorage gespeichert',
  },
});

export default quickstartTranslationDe;
