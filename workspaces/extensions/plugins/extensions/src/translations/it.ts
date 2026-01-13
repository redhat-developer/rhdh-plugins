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

const extensionsTranslationIt = createTranslationMessages({
  ref: extensionsTranslationRef,
  full: true,
  messages: {
    'header.title': 'Estensioni',
    'header.extensions': 'Estensioni',
    'header.catalog': 'Catalogo',
    'header.installedPackages': 'Pacchetti installati',
    'header.installedPackagesWithCount': 'Pacchetti installati ({{count}})',
    'header.pluginsPage': 'Plugin',
    'header.packagesPage': 'Pacchetti',
    'header.collectionsPage': 'Raccolte',
    'button.install': 'Installa',
    'button.uninstall': 'Disinstalla',
    'button.enable': 'Abilita',
    'button.disable': 'Disabilita',
    'button.update': 'Aggiorna',
    'button.save': 'Salva',
    'button.close': 'Chiudi',
    'button.viewAll': 'Visualizza tutti i plugin',
    'button.viewDocumentation': 'Visualizza la documentazione',
    'button.viewInstalledPlugins': 'Visualizza i plugin installati ({{count}})',
    'button.restart': 'È necessario riavviare',
    'status.notInstalled': 'Non installato',
    'status.installed': 'Installato',
    'status.disabled': 'Disabilitato',
    'status.partiallyInstalled': 'Parzialmente installato',
    'status.updateAvailable': 'Aggiornamento disponibile',
    'role.backend': 'Backend',
    'role.backendModule': 'Modulo backend',
    'role.frontend': 'Frontend',
    'emptyState.noPluginsFound': 'Nessun plugin trovato',
    'emptyState.mustEnableBackend':
      'È necessario abilitare il plugin backend Estensioni',
    'emptyState.noPluginsDescription':
      'Si è verificato un errore durante il caricamento dei plugin. Per risolvere il problema, controllare la configurazione o consultare la documentazione del plugin. È anche possibile verificare gli altri plugin disponibili.',
    'emptyState.configureBackend':
      "Configura il plugin '@red-hat-developer-hub/backstage-plugin-extensions-backend'.",

    // Alerts and warnings
    'alert.productionDisabled':
      "L'installazione del plugin è disabilitata nell'ambiente di produzione.",
    'alert.installationDisabled': "L'installazione del plugin è disabilitata.",
    'alert.missingDynamicArtifact':
      "Impossibile gestire questo pacchetto. Per abilitare le azioni, è necessario aggiungere un'entità Catalogo con lo **spec.dynamicArtifact** richiesto.",
    'alert.missingDynamicArtifactTitle': 'Impossibile modificare il pacchetto',
    'alert.missingDynamicArtifactForPlugin':
      "Impossibile gestire questo plugin. Per abilitare le azioni, è necessario aggiungere un'entità Catalogo con lo **spec.dynamicArtifact** richiesto a tutti i pacchetti associati.",
    'alert.missingDynamicArtifactTitlePlugin':
      'Impossibile modificare il plugin',
    'alert.extensionsExample':
      'Per abilitarla, aggiungere o modificare la configurazione delle estensioni nel file di configurazione dynamic-plugins.',
    'alert.singlePluginRestart':
      "Il plugin **{{pluginName}}** richiede il riavvio del sistema backend per completare l'installazione, l'aggiornamento, l'abilitazione o la disabilitazione.",
    'alert.multiplePluginRestart':
      "Sono presenti **{{count}}** plugin che richiedono il riavvio del sistema backend per completare l'installazione, l'aggiornamento, l'abilitazione o la disabilitazione.",
    'alert.singlePackageRestart':
      "Il pacchetto **{{packageName}}** richiede il riavvio del sistema backend per completare l'installazione, l'aggiornamento, l'abilitazione o la disabilitazione.",
    'alert.multiplePackageRestart':
      "Sono presenti **{{count}}** pacchetti che richiedono il riavvio del sistema backend per completare l'installazione, l'aggiornamento, l'abilitazione o la disabilitazione.",
    'alert.restartRequired': '{{count}} plugin installati',
    'alert.backendRestartRequired': 'È necessario riavviare il backend',
    'alert.viewPlugins': 'Visualizza i plugin',
    'alert.viewPackages': 'Visualizza i pacchetti',
    'search.placeholder': 'Ricerca',
    'search.clear': 'Cancella ricerca',
    'search.filter': 'Filtra',
    'search.clearFilter': 'Cancella filtro',
    'search.category': 'Categoria',
    'search.author': 'Autore',
    'search.supportType': 'Tipo di supporto',
    'search.noResults': 'Nessun plugin corrisponde ai criteri di ricerca',
    'search.filterBy': 'Filtra per',
    'search.clearFilters': 'Cancella filtri',
    'search.noResultsFound':
      'Nessun risultato trovato. Regolare i filtri e riprovare.',
    'common.links': 'Collegamenti',
    'common.by': ' di ',
    'common.comma': ', ',
    'common.noDescriptionAvailable': 'nessuna descrizione disponibile',
    'common.readMore': 'Per saperne di più',
    'common.close': 'Chiudi',
    'common.apply': 'Applica',
    'common.couldNotApplyYaml': 'Impossibile applicare YAML: {{error}}',
    'dialog.backendRestartRequired': 'È necessario riavviare il backend',
    'dialog.packageRestartMessage':
      'Per completare le modifiche al pacchetto, riavviare il sistema backend.',
    'dialog.pluginRestartMessage':
      'Per completare le modifiche al plugin, riavviare il sistema backend.',
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
    'package.name': 'Nome pacchetto:',
    'package.version': 'Versione:',
    'package.dynamicPluginPath': 'Percorso plugin dinamico:',
    'package.backstageRole': 'Ruolo Backstage:',
    'package.supportedVersions': 'Versioni supportate:',
    'package.author': 'Autore:',
    'package.support': 'Supporto:',
    'package.lifecycle': 'Ciclo di vita:',
    'package.highlights': 'In evidenza',
    'package.about': 'Informazioni',
    'package.notFound': 'Pacchetto {{namespace}}/{{name}} non trovato.',
    'package.notAvailable': 'Il pacchetto {{name}} non è disponibile',
    'package.ensureCatalogEntity':
      "Verificare l'esistenza di un'entità catalogo per questo pacchetto.",
    'table.packageName': 'Nome pacchetto',
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
    'table.pluginsTable': 'Tabella dei plugin',
    'installedPackages.table.title': 'Pacchetti installati ({{count}})',
    'installedPackages.table.searchPlaceholder': 'Ricerca',
    'installedPackages.table.columns.name': 'Nome',
    'installedPackages.table.columns.packageName': 'nome del pacchetto npm',
    'installedPackages.table.columns.role': 'Ruolo',
    'installedPackages.table.columns.version': 'Versione',
    'installedPackages.table.columns.actions': 'Azioni',
    'installedPackages.table.tooltips.packageProductionDisabled':
      "Impossibile gestire il pacchetto nell'ambiente di produzione.",
    'installedPackages.table.tooltips.installationDisabled':
      "Impossibile gestire il pacchetto perché l'installazione del plugin è disabilitata. Per abilitarla, aggiungere o modificare la configurazione delle estensioni nel file di configurazione dynamic-plugins.",
    'installedPackages.table.tooltips.enableActions':
      "Per abilitare le azioni, aggiungere un'entità catalogo per questo pacchetto",
    'installedPackages.table.tooltips.noDownloadPermissions':
      "L'utente non dispone dell'autorizzazione per scaricare la configurazione. Contattare l'amministratore per richiedere l'accesso o l'assistenza.",
    'installedPackages.table.tooltips.noEditPermissions':
      "L'utente non dispone dell'autorizzazione per modificare la configurazione. Contattare l'amministratore per richiedere l'accesso o l'assistenza.",
    'installedPackages.table.tooltips.noTogglePermissions':
      "L'utente non dispone dell'autorizzazione per abilitare o disabilitare i pacchetti. Contattare l'amministratore per richiedere l'accesso o l'assistenza.",
    'installedPackages.table.tooltips.editPackage':
      'Modifica la configurazione del pacchetto',
    'installedPackages.table.tooltips.downloadPackage':
      'Scarica la configurazione del pacchetto',
    'installedPackages.table.tooltips.enablePackage': 'Abilita il pacchetto',
    'installedPackages.table.tooltips.disablePackage':
      'Disabilita il pacchetto',
    'installedPackages.table.emptyMessages.noResults':
      'Nessun risultato trovato. Provare un termine di ricerca diverso.',
    'installedPackages.table.emptyMessages.noRecords':
      'Nessun record da visualizzare',
    'actions.install': 'Installa',
    'actions.view': 'Visualizza',
    'actions.edit': 'Modifica',
    'actions.enable': 'Abilita',
    'actions.disable': 'Disabilita',
    'actions.actions': 'Azioni',
    'actions.editConfiguration': 'Modifica',
    'actions.pluginConfigurations': 'Configurazioni dei plugin',
    'actions.packageConfiguration': 'Configurazione del pacchetto',
    'actions.pluginCurrentlyEnabled': 'Plugin attualmente abilitato',
    'actions.pluginCurrentlyDisabled': 'Plugin attualmente disabilitato',
    'actions.packageCurrentlyEnabled': 'Pacchetto attualmente abilitato',
    'actions.packageCurrentlyDisabled': 'Pacchetto attualmente disabilitato',
    'actions.installTitle': 'Installare {{displayName}}',
    'actions.editTitle': 'Modificare le configurazioni di {{displayName}}',
    'metadata.by': ' di ',
    'metadata.comma': ', ',
    'metadata.pluginNotFound': 'Plugin {{name}} non trovato.',
    'metadata.pluginNotAvailable': 'Il plugin {{name}} non è disponibile',
    'metadata.ensureCatalogEntityPlugin':
      "Verificare l'esistenza di un'entità catalogo per questo plugin.",
    'metadata.highlights': 'In evidenza',
    'metadata.about': 'Informazioni',
    'metadata.publisher': 'Editore',
    'metadata.supportProvider': 'Fornitore del supporto',
    'metadata.entryName': 'Nome voce',
    'metadata.bySomeone': 'da qualcuno',
    'metadata.category': 'Categoria',
    'metadata.versions': 'Versioni',
    'metadata.backstageCompatibility': 'Versione compatibile con Backstage',
    'supportTypes.certifiedBy': 'Certificato da {{value}} ({{count}})',
    'supportTypes.verifiedBy': 'Verificato da {{value}} ({{count}})',
    'supportTypes.customPlugins': 'Plugin personalizzati ({{count}})',
    'collection.kubernetes': 'Kubernetes',
    'collection.monitoring': 'Monitoraggio',
    'collection.security': 'Sicurezza',
    'collection.viewMore': 'Visualizza altro',
    'collection.pluginCount': '{{count}} plugin',
    'collection.featured.title': 'Plugin in evidenza',
    'collection.featured.description':
      'Una raccolta selezionata di plugin in evidenza consigliati per la maggior parte degli utenti',
    'install.title': 'Installa il plugin',
    'install.configurationRequired': 'Configurazione richiesta',
    'install.optional': 'Opzionale',
    'install.required': 'Richiesta',
    'install.selectPackages': 'Selezionare i pacchetti da installare',
    'install.allPackages': 'Tutti i pacchetti',
    'install.customConfiguration': 'Configurazione personalizzata',
    'install.installProgress': 'Installazione in corso...',
    'install.success': 'Plugin installato correttamente',
    'install.error': 'Impossibile installare il plugin',
    'install.installFrontend': 'Installa il plugin frontend',
    'install.installBackend': 'Installa il plugin backend',
    'install.installTemplates': 'Installa modelli software',
    'install.installationInstructions': "Istruzioni per l'installazione",
    'install.download': 'Scaricamento',
    'install.examples': 'Esempi',
    'install.cancel': 'Cancella',
    'install.reset': 'Reset',
    'install.pluginTabs': 'Schede dei plugin',
    'install.settingUpPlugin': 'Impostazione del plugin',
    'install.aboutPlugin': 'Informazioni sul plugin',
    'install.pluginUpdated': 'Plugin aggiornato',
    'install.pluginInstalled': 'Plugin installato',
    'install.instructions': 'Istruzioni',
    'install.editInstructions': 'Modifica le istruzioni',
    'install.back': 'Indietro',
    'install.packageUpdated': 'Pacchetto aggiornato',
    'install.packageEnabled': 'Pacchetto abilitato',
    'install.packageDisabled': 'Pacchetto disabilitato',
    'install.pluginEnabled': 'Plugin abilitato',
    'install.pluginDisabled': 'Plugin disabilitato',
    'install.errors.missingPluginsList':
      "Contenuto dell'editor non valido: elenco 'plugin' mancante",
    'install.errors.missingPackageItem':
      "Contenuto dell'editor non valido: elemento del pacchetto mancante",
    'install.errors.missingPackageField':
      "Contenuto dell'editor non valido: campo 'pacchetto' mancante nell'elemento",
    'install.errors.failedToSave': 'Impossibile salvare',
    loading: 'Caricamento...',
    error: 'Si è verificato un errore',
    retry: 'Riprovare',
    'errors.missingConfigFile': 'File di configurazione mancante',
    'errors.missingConfigMessage':
      "{{message}}. Per abilitare questo strumento, è necessario aggiungerlo ad app-config.yaml. Modificare il file app-config.yaml come mostrato nell'esempio seguente:",
    'errors.invalidConfigFile': 'File di configurazione non valido',
    'errors.invalidConfigMessage':
      "Impossibile caricare 'extensions.installation.saveToSingleFile.file'. {{message}}. Per abilitare questo strumento, fornire una configurazione di installazione valida. Modificare il file dynamic-plugins.yaml come mostrato nell'esempio seguente:",
    'errors.fileNotExists':
      'Il file di configurazione non è corretto, non è scritto correttamente o non esiste',
    'errors.fileNotExistsMessage':
      "{{message}}. Per abilitare questo strumento come evidenziato nell'esempio seguente, controllare nuovamente il nome del file specificato in app-config.yaml:",
    'errors.unknownError':
      'Errore durante la lettura del file di configurazione. ',
    'tooltips.productionDisabled':
      "L'installazione del plugin è disabilitata nell'ambiente di produzione.",
    'tooltips.extensionsDisabled':
      "L'installazione del plugin è disabilitata. Per abilitarla, aggiungere o modificare la configurazione delle estensioni nel file di configurazione dynamic-plugins.",
    'tooltips.noPermissions':
      "L'utente non dispone delle autorizzazioni necessarie per installare plugin o visualizzarne le configurazioni. Contattare l'amministratore per richiedere l'accesso o l'assistenza.",
    'tooltips.missingDynamicArtifact':
      "Impossibile gestire questo {{type}}. Per abilitare le azioni, è necessario aggiungere un'entità Catalogo con lo spec.dynamicArtifact richiesto.",
    'aria.openPlugin': 'Apri il plugin {{name}}',
    'aria.closeDialog': 'Chiudi finestra di dialogo',
    'aria.expandSection': 'Espandi sezione',
    'aria.collapseSection': 'Comprimi sezione',
    'aria.sortBy': 'Ordina per {{field}}',
    'aria.filterBy': 'Filtra per {{field}}',
    'badges.certified': 'Certificato',
    'badges.certifiedBy': 'Certificato da {{provider}}',
    'badges.verified': 'Verificato',
    'badges.verifiedBy': 'Verificato da {{provider}}',
    'badges.customPlugin': 'Plugin personalizzato',
    'badges.stableAndSecured': 'Stabile e protetto da {{provider}}',
    'badges.generallyAvailable': 'Generalmente disponibile',
    'badges.gaAndSupportedBy':
      'Generalmente disponibile e supportato da {{provider}}',
    'badges.gaAndSupported': 'Generalmente disponibile e supportato',
    'badges.productionReadyBy':
      'Pronto per la produzione e supportato da {{provider}}',
    'badges.productionReady': 'Pronto per la produzione e supportato',
    'badges.communityPlugin': 'Plugin della community',
    'badges.openSourceNoSupport':
      'Plugin open source, nessun supporto ufficiale',
    'badges.techPreview': 'Anteprima tecnica',
    'badges.pluginInDevelopment': 'Plugin ancora in fase di sviluppo',
    'badges.devPreview': 'Anteprima di sviluppo',
    'badges.earlyStageExperimental': 'Plugin sperimentale in fase iniziale',
    'badges.addedByAdmin': "Plugin aggiunti dall'amministratore",
  },
});

export default extensionsTranslationIt;
