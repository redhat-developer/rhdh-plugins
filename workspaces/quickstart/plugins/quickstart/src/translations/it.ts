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
    'button.closeDrawer': 'Chiudi cassetto',
    'button.gotIt': 'Fatto!',
    'button.openQuickstartGuide': 'Apri guida rapida',
    'button.quickstart': 'Avvio rapido',
    'content.emptyState.title':
      'Il contenuto di avvio rapido non è disponibile per il tuo ruolo.',
    'dev.currentState': 'Stato attuale del cassetto: {{state}}',
    'dev.drawerControls': 'Comandi drawer',
    'dev.instructions': 'Istruzioni',
    'dev.pageDescription':
      'Questa è una pagina di prova per il plugin Quickstart. Utilizza i pulsanti sottostanti per interagire con il pannello di avvio rapido.',
    'dev.pageTitle': 'Pagina di prova del plugin Quickstart',
    'dev.stateClosed': 'Chiuso',
    'dev.stateOpen': 'Apri',
    'dev.step1': '1. Fai clic su "Apri guida rapida" per aprire il cassetto',
    'dev.step2': '2. Naviga tra i passaggi della guida rapida',
    'dev.step3':
      '3. Verifica il monitoraggio dei progressi completando i passaggi',
    'dev.step4':
      '4. È possibile chiudere il cassetto utilizzando il pulsante di chiusura o i comandi integrati nel cassetto stesso',
    'dev.step5':
      '5. I progressi vengono salvati automaticamente in localStorage',
    'footer.hide': 'Nascondi',
    'footer.notStarted': 'Non avviato',
    'footer.progress': '{{progress}}% di progresso',
    'header.subtitle': 'Ti guideremo attraverso alcuni semplici passaggi',
    'header.title': 'Iniziamo a usare Developer Hub',
    'item.collapseAriaLabel': 'Comprimi i dettagli di {{title}}',
    'item.collapseButtonAriaLabel': 'Comprimi elemento',
    'item.expandAriaLabel': 'Espandi i dettagli di {{title}}',
    'item.expandButtonAriaLabel': 'Espandi elemento',
    'snackbar.helpPrompt':
      "Hai bisogno di assistenza? Consulta la guida rapida cliccando su (?) nell'intestazione!",
    'steps.configureGit.ctaTitle': 'Scopri di più',
    'steps.configureGit.description':
      'Collega i tuoi provider Git, come GitHub, per gestire il codice, automatizzare i flussi di lavoro e integrarli con le funzionalità della piattaforma.',
    'steps.configureGit.title': 'Configura Git',
    'steps.configureRbac.ctaTitle': "Gestisci l'accesso",
    'steps.configureRbac.description':
      'Assegna ruoli e autorizzazioni per controllare chi può visualizzare, creare o modificare le risorse, garantendo una collaborazione sicura ed efficiente.',
    'steps.configureRbac.title': 'Configura RBAC',
    'steps.exploreSelfServiceTemplates.ctaTitle': 'Esplora i modelli',
    'steps.exploreSelfServiceTemplates.description':
      'Utilizza i nostri modelli self service per configurare rapidamente nuovi progetti, servizi o documentazione.',
    'steps.exploreSelfServiceTemplates.title': 'Esplora i modelli self service',
    'steps.findAllLearningPaths.ctaTitle': 'Visualizza i Learning Path',
    'steps.findAllLearningPaths.description':
      "Integra un e-learning personalizzato nei tuoi flussi di lavoro con i Learning Path per accelerare l'onboarding, colmare le lacune di competenze e promuovere le migliori pratiche.",
    'steps.findAllLearningPaths.title': 'Trova tutti i Learning Path',
    'steps.getStartedWithLightspeed.ctaTitle': 'Scopri di più',
    'steps.getStartedWithLightspeed.description':
      'Risolvi i problemi, genera codice e scopri le risorse della piattaforma grazie alla chat basata su IA.',
    'steps.getStartedWithLightspeed.title': 'Inizia subito con Lightspeed',
    'steps.importApplication.ctaTitle': 'Importa',
    'steps.importApplication.description':
      'Importa codice e servizi esistenti nel catalogo per organizzarli e accedervi tramite il tuo portale per sviluppatori.',
    'steps.importApplication.title': 'Importa applicazione',
    'steps.learnAboutCatalog.ctaTitle': 'Visualizza il catalogo',
    'steps.learnAboutCatalog.description':
      'Scopri tutti i componenti software, i servizi e le API, e visualizza i relativi proprietari e la documentazione.',
    'steps.learnAboutCatalog.title': 'Scopri il Catalogo',
    'steps.managePlugins.ctaTitle': 'Esplora i plugin',
    'steps.managePlugins.description':
      'Esplora e installa estensioni per aggiungere funzionalità, connetterti con strumenti esterni e personalizzare la tua esperienza.',
    'steps.managePlugins.title': 'Gestisci i plugin',
    'steps.setupAuthentication.ctaTitle': 'Scopri di più',
    'steps.setupAuthentication.description':
      'Imposta credenziali di accesso sicure per proteggere il tuo account da accessi non autorizzati.',
    'steps.setupAuthentication.title': "Configura l'autenticazione",
    'steps.setupLightspeed.ctaTitle': 'Scopri di più',
    'steps.setupLightspeed.description':
      "Collega Lightspeed a un modello linguistico di grandi dimensioni (LLM) supportato e configura le autorizzazioni per fornire l'assistenza basata su IA ai tuoi sviluppatori.",
    'steps.setupLightspeed.title': 'Configura Lightspeed',
  },
});

export default quickstartTranslationIt;
