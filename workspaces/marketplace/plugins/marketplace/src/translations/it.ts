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

const marketplaceTranslationIt = createTranslationMessages({
  ref: marketplaceTranslationRef,
  full: true,
  messages: {
    // Page headers and titles
    'header.title': 'Estensioni',
    'header.extensions': 'Estensioni',
    'header.catalog': 'Catalogo',
    'header.installedPackages': 'Pacchetti installati',
    'header.installedPackagesWithCount': 'Pacchetti installati ({{count}})',
    'header.pluginsPage': 'Plugin',
    'header.packagesPage': 'Pacchetti',
    'header.collectionsPage': 'Collezioni',

    // Navigation and buttons
    'button.install': 'Installa',
    'button.uninstall': 'Disinstalla',
    'button.enable': 'Abilita',
    'button.disable': 'Disabilita',
    'button.update': 'Aggiorna',
    'button.save': 'Salva',
    'button.close': 'Chiudi',
    'button.viewAll': 'Visualizza tutti i plugin',
    'button.viewDocumentation': 'Visualizza documentazione',
    'button.viewInstalledPlugins': 'Visualizza plugin installati ({{count}})',
    'button.restart': 'Riavvio richiesto',

    // Status labels
    'status.notInstalled': 'Non installato',
    'status.installed': 'Installato',
    'status.disabled': 'Disabilitato',
    'status.partiallyInstalled': 'Parzialmente installato',
    'status.updateAvailable': 'Aggiornamento disponibile',

    // Role labels
    'role.backend': 'Backend',
    'role.backendModule': 'Modulo backend',
    'role.frontend': 'Frontend',

    // Empty states and errors
    'emptyState.noPluginsFound': 'Nessun plugin trovato',
    'emptyState.mustEnableBackend':
      'Devi abilitare il plugin backend delle Estensioni',
    'emptyState.noPluginsDescription':
      'Si è verificato un errore durante il caricamento dei plugin. Controlla la tua configurazione o consulta la documentazione del plugin per risolvere. Puoi anche esplorare altri plugin disponibili.',
    'emptyState.configureBackend':
      "Configura il plugin '@red-hat-developer-hub/backstage-plugin-marketplace-backend'.",

    // Alerts and warnings
    'alert.productionDisabled':
      "L'installazione dei plugin è disabilitata nell'ambiente di produzione.",
    'alert.installationDisabled': "L'installazione dei plugin è disabilitata.",
    'alert.missingDynamicArtifact':
      "Questo pacchetto non può essere gestito. Per abilitare le azioni, deve essere aggiunta un'entità del catalogo con il **spec.dynamicArtifact** richiesto.",
    'alert.missingDynamicArtifactTitle':
      'Il pacchetto non può essere modificato',
    'alert.missingDynamicArtifactForPlugin':
      "Questo plugin non può essere gestito. Per abilitare le azioni, deve essere aggiunta un'entità del catalogo con il **spec.dynamicArtifact** richiesto a tutti i pacchetti associati.",
    'alert.missingDynamicArtifactTitlePlugin':
      'Il plugin non può essere modificato',
    'alert.extensionsExample':
      'Per abilitarlo, aggiungi o modifica la configurazione delle estensioni nel tuo file di configurazione dei plugin dinamici.',
    'alert.singlePluginRestart':
      "Il plugin **{{pluginName}}** richiede un riavvio del sistema backend per completare l'installazione, l'aggiornamento, l'abilitazione o la disabilitazione.",
    'alert.multiplePluginRestart':
      "Hai **{{count}}** plugin che richiedono un riavvio del tuo sistema backend per completare l'installazione, l'aggiornamento, l'abilitazione o la disabilitazione.",
    'alert.singlePackageRestart':
      "Il pacchetto **{{packageName}}** richiede un riavvio del sistema backend per completare l'installazione, l'aggiornamento, l'abilitazione o la disabilitazione.",
    'alert.multiplePackageRestart':
      "Hai **{{count}}** pacchetti che richiedono un riavvio del tuo sistema backend per completare l'installazione, l'aggiornamento, l'abilitazione o la disabilitazione.",
    'alert.restartRequired': '{{count}} plugin installati',
    'alert.backendRestartRequired': 'Riavvio del backend richiesto',
    'alert.viewPlugins': 'Visualizza plugin',
    'alert.viewPackages': 'Visualizza pacchetti',

    // Search and filtering
    'search.placeholder': 'Cerca plugin...',
    'search.clear': 'Cancella ricerca',
    'search.filter': 'Filtra',
    'search.clearFilter': 'Cancella filtro',
    'search.noResults': 'Nessun plugin corrisponde ai tuoi criteri di ricerca',
    'search.filterBy': 'Filtra per',
    'search.clearFilters': 'Cancella filtri',
    'search.noResultsFound':
      'Nessun risultato trovato. Modifica i tuoi filtri e riprova.',
    'search.category': 'Categoria',
    'search.author': 'Autore',
    'search.supportType': 'Tipo di supporto',

    // General UI text
    'common.links': 'Collegamenti',
    'common.by': ' di ',
    'common.comma': ', ',
    'common.noDescriptionAvailable': 'nessuna descrizione disponibile',
    'common.readMore': 'Leggi di più',
    'common.close': 'Chiudi',
    'common.apply': 'Applica',
    'common.couldNotApplyYaml': 'Impossibile applicare YAML: {{error}}',

    // Dialogs
    'dialog.backendRestartRequired': 'Riavvio del backend richiesto',
    'dialog.packageRestartMessage':
      'Per completare le modifiche del pacchetto, riavvia il tuo sistema backend.',
    'dialog.pluginRestartMessage':
      'Per completare le modifiche del plugin, riavvia il tuo sistema backend.',

    // Plugin details
    'plugin.description': 'Descrizione',
    'plugin.documentation': 'Documentazione',
    'plugin.repository': 'Repository',
    'plugin.license': 'Licenza',
    'plugin.version': 'Versione',
    'plugin.author': 'Autore',
    'plugin.authors': 'Autori',
    'plugin.tags': 'Tag',
    'plugin.dependencies': 'Dipendenze',
    'plugin.configuration': 'Configurazione',
    'plugin.installation': 'Installazione',

    // Package details
    'package.name': 'Nome del pacchetto:',
    'package.version': 'Versione:',
    'package.dynamicPluginPath': 'Percorso del plugin dinamico:',
    'package.backstageRole': 'Ruolo Backstage:',
    'package.supportedVersions': 'Versioni supportate:',
    'package.author': 'Autore:',
    'package.support': 'Supporto:',
    'package.lifecycle': 'Ciclo di vita:',
    'package.highlights': 'Punti salienti',
    'package.about': 'Informazioni',
    'package.notFound': 'Pacchetto {{namespace}}/{{name}} non trovato!',
    'package.notAvailable': 'Il pacchetto {{name}} non è disponibile',
    'package.ensureCatalogEntity':
      "Assicurati che esista un'entità del catalogo per questo pacchetto.",

    // Tables and lists
    'table.packageName': 'Nome del pacchetto',
    'table.version': 'Versione',
    'table.role': 'Ruolo',
    'table.supportedVersion': 'Versione supportata',
    'table.status': 'Stato',
    'table.name': 'Nome',
    'table.action': 'Azione',
    'table.description': 'Descrizione',
    'table.versions': 'Versioni',
    'table.plugins': 'Plugin',
    'table.packages': 'Pacchetti',
    'table.pluginsCount': 'Plugin ({{count}})',
    'table.packagesCount': 'Pacchetti ({{count}})',
    'table.pluginsTable': 'Tabella plugin',

    // Installed packages table
    'installedPackages.table.title': 'Pacchetti installati ({{count}})',
    'installedPackages.table.searchPlaceholder': 'Cerca',
    'installedPackages.table.columns.name': 'Nome',
    'installedPackages.table.columns.packageName': 'nome del pacchetto npm',
    'installedPackages.table.columns.role': 'Ruolo',
    'installedPackages.table.columns.version': 'Versione',
    'installedPackages.table.columns.actions': 'Azioni',
    'installedPackages.table.tooltips.packageProductionDisabled':
      "Il pacchetto non può essere gestito nell'ambiente di produzione.",
    'installedPackages.table.tooltips.installationDisabled':
      "Il pacchetto non può essere gestito perché l'installazione dei plugin è disabilitata. Per abilitarla, aggiungi o modifica la configurazione delle estensioni nel tuo file di configurazione dei plugin dinamici.",
    'installedPackages.table.tooltips.enableActions':
      "Per abilitare le azioni, aggiungi un'entità del catalogo per questo pacchetto",
    'installedPackages.table.tooltips.noDownloadPermissions':
      'Non hai il permesso di scaricare la configurazione. Contatta il tuo amministratore per richiedere accesso o assistenza.',
    'installedPackages.table.tooltips.noEditPermissions':
      'Non hai il permesso di modificare la configurazione. Contatta il tuo amministratore per richiedere accesso o assistenza.',
    'installedPackages.table.tooltips.noTogglePermissions':
      'Non hai il permesso di abilitare o disabilitare i pacchetti. Contatta il tuo amministratore per richiedere accesso o assistenza.',
    'installedPackages.table.tooltips.editPackage':
      'Modifica configurazione del pacchetto',
    'installedPackages.table.tooltips.downloadPackage':
      'Scarica configurazione del pacchetto',
    'installedPackages.table.tooltips.enablePackage': 'Abilita pacchetto',
    'installedPackages.table.tooltips.disablePackage': 'Disabilita pacchetto',
    'installedPackages.table.emptyMessages.noResults':
      'Nessun risultato trovato. Prova con un termine di ricerca diverso.',
    'installedPackages.table.emptyMessages.noRecords':
      'Nessun record da visualizzare',

    // Plugin actions and states
    'actions.install': 'Installa',
    'actions.view': 'Visualizza',
    'actions.edit': 'Modifica',
    'actions.enable': 'Abilita',
    'actions.disable': 'Disabilita',
    'actions.actions': 'Azioni',
    'actions.editConfiguration': 'Modifica',
    'actions.pluginConfigurations': 'Configurazioni del plugin',
    'actions.packageConfiguration': 'Configurazione del pacchetto',
    'actions.pluginCurrentlyEnabled': 'Plugin attualmente abilitato',
    'actions.pluginCurrentlyDisabled': 'Plugin attualmente disabilitato',
    'actions.packageCurrentlyEnabled': 'Pacchetto attualmente abilitato',
    'actions.packageCurrentlyDisabled': 'Pacchetto attualmente disabilitato',
    'actions.installTitle': 'Installa {{displayName}}',
    'actions.editTitle': 'Modifica configurazioni di {{displayName}}',

    // Plugin metadata
    'metadata.by': ' di ',
    'metadata.comma': ', ',
    'metadata.pluginNotFound': 'Plugin {{name}} non trovato!',
    'metadata.pluginNotAvailable': 'Il plugin {{name}} non è disponibile',
    'metadata.ensureCatalogEntityPlugin':
      "Assicurati che esista un'entità del catalogo per questo plugin.",
    'metadata.highlights': 'Punti salienti',
    'metadata.about': 'Informazioni',
    'metadata.publisher': 'Editore',
    'metadata.supportProvider': 'Fornitore di supporto',
    'metadata.entryName': "Nome dell'entrata",
    'metadata.bySomeone': 'di qualcuno',
    'metadata.category': 'Categoria',
    'metadata.versions': 'Versioni',
    'metadata.backstageCompatibility': 'Versione di compatibilità Backstage',

    // Support type filters
    'supportTypes.certifiedBy': 'Certificato da {{value}} ({{count}})',
    'supportTypes.verifiedBy': 'Verificato da {{value}} ({{count}})',
    'supportTypes.customPlugins': 'Plugin personalizzati ({{count}})',

    // Collections
    'collection.kubernetes': 'Kubernetes',
    'collection.monitoring': 'Monitoraggio',
    'collection.security': 'Sicurezza',
    'collection.viewMore': 'Visualizza di più',
    'collection.pluginCount': '{{count}} plugin',
    'collection.featured.title': 'Plugin in evidenza',
    'collection.featured.description':
      'Una collezione curata di plugin consigliati per la maggior parte degli utenti',

    // Installation and configuration
    'install.title': 'Installa Plugin',
    'install.configurationRequired': 'Configurazione richiesta',
    'install.optional': 'Opzionale',
    'install.required': 'Richiesto',
    'install.selectPackages': 'Seleziona pacchetti da installare',
    'install.allPackages': 'Tutti i pacchetti',
    'install.customConfiguration': 'Configurazione personalizzata',
    'install.installProgress': 'Installazione in corso...',
    'install.success': 'Plugin installato con successo',
    'install.error': 'Installazione del plugin fallita',
    'install.installFrontend': 'Installa plugin frontend',
    'install.installBackend': 'Installa plugin backend',
    'install.installTemplates': 'Installa modelli software',
    'install.installationInstructions': 'Istruzioni di installazione',
    'install.download': 'Scarica',
    'install.examples': 'Esempi',
    'install.cancel': 'Annulla',
    'install.reset': 'Reimposta',
    'install.pluginTabs': 'Tab del plugin',
    'install.settingUpPlugin': 'Configurazione del plugin',
    'install.aboutPlugin': 'Informazioni sul plugin',
    'install.pluginUpdated': 'Plugin aggiornato',
    'install.pluginInstalled': 'Plugin installato',
    'install.instructions': 'Istruzioni',
    'install.editInstructions': 'Modifica istruzioni',
    'install.back': 'Indietro',
    'install.packageUpdated': 'Pacchetto aggiornato',
    'install.packageEnabled': 'Pacchetto abilitato',
    'install.packageDisabled': 'Pacchetto disabilitato',
    'install.pluginEnabled': 'Plugin abilitato',
    'install.pluginDisabled': 'Plugin disabilitato',
    'install.errors.missingPluginsList':
      "Contenuto dell'editor non valido: manca l'elenco 'plugins'",
    'install.errors.missingPackageItem':
      "Contenuto dell'editor non valido: elemento del pacchetto mancante",
    'install.errors.missingPackageField':
      "Contenuto dell'editor non valido: campo 'package' mancante nell'elemento",
    'install.errors.failedToSave': 'Salvataggio fallito',

    // Loading and error states
    loading: 'Caricamento in corso...',
    error: 'Si è verificato un errore',
    retry: 'Riprova',

    // Error messages
    'errors.missingConfigFile': 'File di configurazione mancante',
    'errors.missingConfigMessage':
      "{{message}}. Devi aggiungerlo al tuo app-config.yaml se vuoi abilitare questo strumento. Modifica il file app-config.yaml come mostrato nell'esempio seguente:",
    'errors.invalidConfigFile': 'File di configurazione non valido',
    'errors.invalidConfigMessage':
      "Errore nel caricamento di 'extensions.installation.saveToSingleFile.file'. {{message}}. Fornisci una configurazione di installazione valida se vuoi abilitare questo strumento. Modifica il tuo file dynamic-plugins.yaml come mostrato nell'esempio seguente:",
    'errors.fileNotExists':
      'Il file di configurazione è errato, scritto male o non esiste',
    'errors.fileNotExistsMessage':
      "{{message}}. Ricontrolla il nome del file specificato nel tuo app-config.yaml se vuoi abilitare questo strumento come evidenziato nell'esempio seguente:",
    'errors.unknownError': 'Errore nella lettura del file di configurazione. ',

    // Tooltip messages
    'tooltips.productionDisabled':
      "L'installazione dei plugin è disabilitata nell'ambiente di produzione.",
    'tooltips.extensionsDisabled':
      "L'installazione dei plugin è disabilitata. Per abilitarla, aggiungi o modifica la configurazione delle estensioni nel tuo file di configurazione dei plugin dinamici.",
    'tooltips.noPermissions':
      'Non hai il permesso di installare plugin o visualizzare le loro configurazioni. Contatta il tuo amministratore per richiedere accesso o assistenza.',
    'tooltips.missingDynamicArtifact':
      "Questo {{type}} non può essere gestito. Per abilitare le azioni, deve essere aggiunta un'entità del catalogo con il spec.dynamicArtifact richiesto.",
    // Accessibility
    'aria.openPlugin': 'Apri plugin {{name}}',
    'aria.closeDialog': 'Chiudi dialogo',
    'aria.expandSection': 'Espandi sezione',
    'aria.collapseSection': 'Comprimi sezione',
    'aria.sortBy': 'Ordina per {{field}}',
    'aria.filterBy': 'Filtra per {{field}}',
    'badges.certified': 'Certificato',
    'badges.certifiedBy': 'Certificato da {{provider}}',
    'badges.verified': 'Verificato',
    'badges.verifiedBy': 'Verificato da {{provider}}',
    'badges.customPlugin': 'Plugin personalizzato',
    'badges.stableAndSecured': 'Stabile e sicuro da {{provider}}',
    'badges.generallyAvailable': 'Generalmente disponibile (GA)',
    'badges.gaAndSupportedBy':
      'Generalmente disponibile (GA) e supportato da {{provider}}',
    'badges.gaAndSupported': 'Generalmente disponibile (GA) e supportato',
    'badges.productionReadyBy':
      'Pronto per la produzione e supportato da {{provider}}',
    'badges.productionReady': 'Pronto per la produzione e supportato',
    'badges.communityPlugin': 'Plugin della comunità',
    'badges.openSourceNoSupport':
      'Plugin open source, nessun supporto ufficiale',
    'badges.techPreview': 'Anteprima tecnica (TP)',
    'badges.pluginInDevelopment': 'Plugin ancora in sviluppo',
    'badges.devPreview': 'Anteprima sviluppatore (DP)',
    'badges.earlyStageExperimental': 'Un plugin sperimentale in fase iniziale',
    'badges.addedByAdmin': "Plugin aggiunti dall'amministratore",
  },
});

export default marketplaceTranslationIt;
