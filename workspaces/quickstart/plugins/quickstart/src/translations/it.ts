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

/**
 * Italian translation for plugin.quickstart.
 * @public
 */
const quickstartTranslationIt = createTranslationMessages({
  ref: quickstartTranslationRef,
  messages: {
    'header.title': 'Muoviamo insieme i primi passi con Developer Hub',
    'header.subtitle': 'Ti guideremo attraverso alcuni rapidi passaggi',
    'steps.setupAuthentication.title': "Impostazione dell'autenticazione",
    'steps.setupAuthentication.description':
      "Impostazione di credenziali di accesso sicure per proteggere l'account da accessi non autorizzati.",
    'steps.setupAuthentication.ctaTitle': 'Per saperne di più',
    'steps.configureRbac.title': 'Configurazione di RBAC',
    'steps.configureRbac.description':
      'Assegnare ruoli e autorizzazioni per controllare chi può visualizzare, creare o modificare le risorse, per garantire una collaborazione sicura ed efficiente.',
    'steps.configureRbac.ctaTitle': "Gestisci l'accesso",
    'steps.configureGit.title': 'Configurazione di Git',
    'steps.configureGit.description':
      'Collegare i provider Git, come GitHub, per gestire il codice, automatizzare i flussi di lavoro e integrare le funzionalità della piattaforma.',
    'steps.configureGit.ctaTitle': 'Per saperne di più',
    'steps.managePlugins.title': 'Gestione dei plugin',
    'steps.managePlugins.description':
      "Sfogliare e installare le estensioni per aggiungere funzionalità, connettersi a strumenti esterni e personalizzare l'esperienza utente.",
    'steps.managePlugins.ctaTitle': 'Esplora i plugin',
    'steps.importApplication.title': "Importare l'applicazione",
    'steps.importApplication.description':
      'Importare il codice e i servizi esistenti nel catalogo per organizzarli e accedervi tramite il portale per sviluppatori.',
    'steps.importApplication.ctaTitle': 'Importa',
    'steps.learnAboutCatalog.title': 'Analisi del catalogo',
    'steps.learnAboutCatalog.description':
      'Scoprire tutti i componenti software, i servizi e le API e visualizzarne proprietari e documentazione.',
    'steps.learnAboutCatalog.ctaTitle': 'Visualizza catalogo',
    'steps.exploreSelfServiceTemplates.title':
      'Esplorare i modelli self-service',
    'steps.exploreSelfServiceTemplates.description':
      'Utilizzare i nostri modelli self-service per configurare rapidamente nuovi progetti, servizi o documentazione.',
    'steps.exploreSelfServiceTemplates.ctaTitle': 'Esplora i modelli',
    'steps.findAllLearningPaths.title':
      'Individuare tutti i percorsi di apprendimento',
    'steps.findAllLearningPaths.description':
      "Integrare l'e-learning personalizzato nei flussi di lavoro con i percorsi di apprendimento per accelerare l'onboarding, colmare le lacune di competenze e promuovere le best practice.",
    'steps.findAllLearningPaths.ctaTitle':
      'Visualizzare i percorsi di apprendimento',
    'button.quickstart': 'Avvio rapido',
    'button.openQuickstartGuide': "Apri la Guida all'avvio rapido",
    'button.closeDrawer': 'Chiudi riquadro',
    'button.gotIt': 'Ho capito!',
    'footer.progress': '{{progress}}% di avanzamento',
    'footer.notStarted': 'Non iniziato',
    'footer.hide': 'Nascondi',
    'content.emptyState.title':
      'Contenuto di avvio rapido non disponibile per il ruolo utente.',
    'item.expandAriaLabel': 'Espandi i dettagli di {{title}}',
    'item.collapseAriaLabel': 'Comprimi i dettagli di {{title}}',
    'item.expandButtonAriaLabel': 'Espandi elemento',
    'item.collapseButtonAriaLabel': 'Comprimi elemento',
    'dev.pageTitle': 'Pagina di prova del plugin di avvio rapido',
    'dev.pageDescription':
      'Questa è una pagina di prova per il plugin di avvio rapido. Utilizzare i pulsanti sottostanti per interagire con il riquadro di avvio rapido.',
    'dev.drawerControls': 'Comandi del riquadro',
    'dev.currentState': 'Stato attuale del riquadro: {{state}}',
    'dev.stateOpen': 'Aperto',
    'dev.stateClosed': 'Chiuso',
    'dev.instructions': 'Istruzioni',
    'dev.step1':
      '1. Fare clic su "Apri la Guida all\'avvio rapido" per aprire il riquadro',
    'dev.step2': '2. Navigare tra i passaggi di avvio rapido',
    'dev.step3':
      '3. Testare il monitoraggio dei progressi completando i passaggi',
    'dev.step4':
      '4. È possibile chiudere il riquadro utilizzando il pulsante di chiusura o i comandi del riquadro stesso',
    'dev.step5':
      '5. I progressi vengono salvati automaticamente su localStorage',
  },
});

export default quickstartTranslationIt;
