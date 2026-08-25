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

import {
  createTranslationMessages,
  type TranslationMessages,
} from '@backstage/core-plugin-api/alpha';
import { dcmTranslationRef } from './ref';

const dcmTranslationIt: TranslationMessages<
  'plugin.dcm',
  Record<string, string>
> = createTranslationMessages({
  ref: dcmTranslationRef,
  messages: {
    'page.title': 'Centro dati',
    'page.tabs.agents': 'Agenti',
    'page.tabs.policies': 'Criteri',
    'page.tabs.serviceTypes': 'Tipi di servizio',
    'page.tabs.catalogItems': 'Elementi del catalogo',
    'page.tabs.instances': 'Istanze',
    'page.tabs.resources': 'Risorse',
    'common.retry': 'Riprova',
    'common.refresh': 'Aggiorna',
    'common.search': 'Cerca',
    'common.clearSearch': 'Cancella ricerca',
    'common.edit': 'Modifica',
    'common.delete': 'Elimina',
    'common.actions': 'Azioni',
    'common.cancel': 'Annulla',
    'common.save': 'Salva',
    'common.saving': 'Salvataggio\u2026',
    'common.close': 'Chiudi',
    'common.rows': 'righe',
    'common.previousPage': 'Precedente',
    'common.nextPage': 'Successivo',
    'common.next': 'Avanti',
    'common.back': 'Indietro',
    'common.loadingMore': 'Caricamento\u2026',
    'deleteDialog.title': 'Elimina {{resourceLabel}}',
    'deleteDialog.confirmButton': 'Elimina',
    'deleteDialog.cancelButton': 'Annulla',
    'deleteDialog.body':
      'Eliminare {{resourceName}}? Questa azione non pu\u00f2 essere annullata.',
    'agents.emptyTitle': 'Nessun agente registrato',
    'agents.emptyDescription':
      'Gli agenti di ambiente si registrano nel piano di controllo e inviano heartbeat periodici.',
    'agents.registerButton': 'Registra',
    'agents.entityLabel': 'Agenti',
    'agents.registerDialogTitle': 'Registra agente',
    'agents.createSuccess': 'Agente registrato correttamente.',
    'agents.columns.name': 'Nome',
    'agents.columns.environment': 'Ambiente',
    'agents.columns.serviceTypes': 'Tipi di servizio',
    'agents.columns.cost': 'Costo',
    'agents.columns.topic': 'Topic',
    'agents.columns.health': 'Stato',
    'agents.columns.lastHeartbeat': 'Ultimo heartbeat',
    'agents.filter.healthLabel': 'Stato di salute',
    'agents.filter.healthAll': 'Tutti',
    'agents.filter.healthReady': 'Pronto',
    'agents.filter.healthCongested': 'Congestionato',
    'agents.filter.healthUnavailable': 'Non disponibile',
    'agents.form.nameLabel': 'Nome *',
    'agents.form.namePlaceholder': 'es. env-agent-west-1',
    'agents.form.nameHelper':
      'Identificatore univoco \u2014 solo lettere minuscole, numeri e trattini',
    'agents.form.environmentLabel': 'Ambiente *',
    'agents.form.environmentPlaceholder': 'es. production',
    'agents.form.environmentHelper': "Etichetta ambiente dell'agente",
    'agents.form.serviceTypesLabel': 'Tipi di servizio *',
    'agents.form.serviceTypesHelper':
      'Tipi di servizio che questo agente pu\u00f2 fornire',
    'agents.form.costLabel': 'Costo *',
    'agents.form.costHelper':
      'Peso di costo relativo per le decisioni di posizionamento',
    'agents.form.topicNameLabel': 'Nome topic *',
    'agents.form.topicNamePlaceholder': 'es. dcm.agent.env-agent-west-1',
    'agents.form.topicNameHelper':
      'Nome del topic NATS \u2014 deve iniziare con dcm.agent.',
    'policies.emptyTitle': 'Nessun criterio definito',
    'policies.emptyDescription':
      'Crea criteri OPA Rego per applicare regole di governance alle risorse DCM.',
    'policies.createButton': 'Crea',
    'policies.entityLabel': 'Criteri',
    'policies.createDialogTitle': 'Crea criterio',
    'policies.editDialogTitle': 'Modifica criterio',
    'policies.saveButton': 'Salva',
    'policies.createSuccess': 'Criterio creato correttamente.',
    'policies.updateSuccess': 'Criterio aggiornato correttamente.',
    'policies.deleteSuccess': 'Criterio eliminato correttamente.',
    'policies.deleteLabel': 'criterio',
    'policies.enabledYes': 'S\u00ec',
    'policies.enabledNo': 'No',
    'policies.toggleDisable': 'Disabilita criterio',
    'policies.toggleEnable': 'Abilita criterio',
    'policies.toggleDisableAria': 'Disabilita',
    'policies.toggleEnableAria': 'Abilita',
    'policies.columns.displayName': 'Nome visualizzato',
    'policies.columns.type': 'Tipo',
    'policies.columns.priority': 'Priorit\u00e0',
    'policies.columns.enabled': 'Abilitato',
    'policies.columns.description': 'Descrizione',
    'policies.form.displayNameLabel': 'Nome visualizzato *',
    'policies.form.displayNameHelper': 'Nome leggibile per questo criterio',
    'policies.form.descriptionLabel': 'Descrizione',
    'policies.form.descriptionHelper':
      'Opzionale \u2014 descrivere lo scopo di questo criterio',
    'policies.form.policyTypeLabel': 'Tipo di criterio *',
    'policies.form.policyTypeGlobal':
      'GLOBAL \u2014 si applica a tutte le richieste',
    'policies.form.policyTypeUser': 'USER \u2014 si applica per utente',
    'policies.form.priorityLabel': 'Priorit\u00e0 *',
    'policies.form.priorityHelper':
      '1 (massima) \u2013 1000 (minima), predefinito 500',
    'policies.form.regoCodeLabel': 'Codice Rego *',
    'policies.form.regoCodeHelper':
      'Criterio OPA Rego valutato dal Gestore del posizionamento.',
    'policies.form.regoCodePlaceholder': 'package dcm.placement',
    'policies.form.enabledLabel': 'Abilitato',
    'serviceTypes.emptyTitle': 'Nessun tipo di servizio definito',
    'serviceTypes.emptyDescription':
      'I tipi di servizio definiscono lo schema del modello per gli elementi del catalogo.',
    'serviceTypes.cardTitle': 'Tipi di servizio ({{count}})',
    'serviceTypes.columns.serviceType': 'Tipo di servizio',
    'serviceTypes.columns.apiVersion': 'Versione API',
    'serviceTypes.columns.path': 'Percorso',
    'serviceTypes.columns.created': 'Creato',
    'catalogItems.emptyTitle': 'Nessun elemento del catalogo definito',
    'catalogItems.emptyDescription':
      'Gli elementi del catalogo sono modelli di servizio che gli sviluppatori possono effettuare il provisioning.',
    'catalogItems.createButton': 'Crea',
    'catalogItems.entityLabel': 'Elementi del catalogo',
    'catalogItems.createDrawerTitle': 'Crea elemento del catalogo',
    'catalogItems.editDrawerTitle': 'Modifica elemento del catalogo',
    'catalogItems.saveButton': 'Salva',
    'catalogItems.createSuccess': 'Elemento del catalogo creato correttamente.',
    'catalogItems.updateSuccess':
      'Elemento del catalogo aggiornato correttamente.',
    'catalogItems.deleteSuccess':
      'Elemento del catalogo eliminato correttamente.',
    'catalogItems.deleteLabel': 'elemento del catalogo',
    'catalogItems.columns.displayName': 'Nome visualizzato',
    'catalogItems.columns.apiVersion': 'Versione API',
    'catalogItems.columns.resources': 'Risorse',
    'catalogItems.columns.fields': 'Campi',
    'catalogItems.columns.created': 'Creato',
    'catalogItems.fieldCount_one': '1 campo',
    'catalogItems.fieldCount_other': '{{count}} campi',
    'catalogItems.resourceCount_one': '1 risorsa',
    'catalogItems.resourceCount_other': '{{count}} risorse',
    'catalogItems.form.importButton': 'Importa da file',
    'catalogItems.form.importTooltip':
      'Compila il modulo da una definizione JSON o YAML',
    'catalogItems.form.importError':
      'Impossibile importare il file \u2014 verifica che sia un JSON o YAML valido.',
    'catalogItems.form.displayNameLabel': 'Nome visualizzato *',
    'catalogItems.form.displayNameHelper':
      'Nome leggibile per questo elemento del catalogo (max 63 caratteri)',
    'catalogItems.form.apiVersionLabel': 'Versione API *',
    'catalogItems.form.apiVersionHelper':
      'Deve seguire il pattern v<numero>[alpha|beta][numero] \u2014 p.\u00a0es. v1, v1alpha1',
    'catalogItems.form.serviceTypeLabel': 'Tipo di servizio *',
    'catalogItems.form.serviceTypeHelperEdit':
      'Il tipo di servizio non pu\u00f2 essere modificato dopo la creazione',
    'catalogItems.form.serviceTypeHelperNoTypes':
      'Nessun tipo di servizio disponibile \u2014 crea prima un tipo nella scheda Tipi di servizio',
    'catalogItems.form.serviceTypeHelperDefault':
      'Seleziona il tipo di servizio su cui si basa questo elemento',
    'catalogItems.form.fieldsLabel': 'Campi *',
    'catalogItems.form.fieldsCaption': '(almeno uno richiesto)',
    'catalogItems.form.fieldsErrorEmpty':
      'Aggiungi almeno un campo con un percorso non vuoto.',
    'catalogItems.form.fieldAddButton': 'Aggiungi campo',
    'catalogItems.form.fieldAddTooltip':
      'Compila il percorso dell\u2019ultimo campo prima di aggiungerne uno nuovo',
    'catalogItems.form.fieldPathLabel': 'Percorso *',
    'catalogItems.form.fieldPathHelper': 'p.\u00a0es. config.replicas',
    'catalogItems.form.fieldDisplayNameLabel': 'Nome visualizzato',
    'catalogItems.form.fieldEditableLabel': 'Modificabile',
    'catalogItems.form.fieldDefaultValueLabel': 'Valore predefinito',
    'catalogItems.form.fieldDefaultValueHelper':
      'Qualsiasi valore JSON \u2014 p.\u00a0es. 42, "ciao", true, [1,2]',
    'catalogItems.form.fieldRemoveAriaLabel': 'Rimuovi campo',
    'catalogItems.form.schemaLabel': 'Schema di validazione',
    'catalogItems.form.schemaEditButton': 'Modifica JSON',
    'catalogItems.form.schemaAddButton': 'Aggiungi JSON',
    'catalogItems.form.schemaDialogTitle': 'Schema di validazione',
    'catalogItems.form.schemaDialogHelper':
      'Oggetto JSON Schema \u2014 p.\u00a0es. {"type":"integer","minimum":0}',
    'catalogItems.form.schemaDialogCancel': 'Annulla',
    'catalogItems.form.schemaDialogApply': 'Applica',
    'catalogItems.form.schemaMustBeObject':
      'Deve essere un oggetto JSON, non un array o un valore primitivo',
    'catalogItems.form.schemaInvalidJson': 'Sintassi JSON non valida',
    'catalogItems.wizard.tabOverview': 'Panoramica',
    'catalogItems.wizard.tabApi': 'API',
    'catalogItems.wizard.tabResources': 'Risorse',
    'catalogItems.wizard.resourcesDescription':
      'Aggiungi una o pi\u00f9 risorse. Ogni risorsa fa riferimento a un tipo di servizio e definisce i propri campi.',
    'catalogItems.wizard.resourcesRequired':
      '\u00c8 richiesta almeno una risorsa.',
    'catalogItems.wizard.addResourceButton': 'Aggiungi risorsa',
    'catalogItems.wizard.removeResource': 'Rimuovi risorsa',
    'catalogItems.wizard.unnamedResource': '(senza nome)',
    'catalogItems.wizard.resourceNameLabel': 'Nome risorsa *',
    'catalogItems.wizard.resourceNameHelper':
      'Identificatore univoco all\u2019interno di questo elemento del catalogo \u2014 p.\u00a0es. app, ordersDb',
    'catalogItems.wizard.requiresResourcesLabel': 'Risorse richieste',
    'catalogItems.wizard.requiresResourcesHelper':
      'Seleziona le risorse che devono essere sottoposte a provisioning prima di questa',
    'catalogItems.wizard.apiVersionImmutable':
      'La versione API non pu\u00f2 essere modificata dopo la creazione',
    'instances.emptyTitle': 'Nessuna istanza sottoposta a provisioning',
    'instances.emptyDescription':
      'Le istanze degli elementi del catalogo rappresentano servizi sottoposti a provisioning.',
    'instances.createButton': 'Crea',
    'instances.entityLabel': 'Istanze degli elementi del catalogo',
    'instances.createDialogTitle': 'Crea istanza di elemento del catalogo',
    'instances.rehydrateSuccess':
      'Istanza dell\u2019elemento del catalogo reidratata correttamente.',
    'instances.deleteLabel': 'istanza',
    'instances.rehydrateTooltip': 'Reidrata',
    'instances.rehydrateAriaLabel': 'Reidrata istanza',
    'instances.deleteTooltip': 'Elimina',
    'instances.deleteAriaLabel': 'Elimina istanza',
    'instances.rehydrateDialogTitle': 'Reidratare l\u2019istanza?',
    'instances.rehydrateDialogBody':
      'La reidratazione di {{instanceName}} effettuer\u00e0 nuovamente il provisioning della risorsa e potrebbe assegnarle un nuovo ID. Questa azione non pu\u00f2 essere annullata.',
    'instances.rehydrateDialogFallbackName': 'questa istanza',
    'instances.rehydrateDialogCancel': 'Annulla',
    'instances.rehydrateDialogConfirm': 'Reidrata',
    'instances.columns.displayName': 'Nome visualizzato',
    'instances.columns.catalogItem': 'Elemento del catalogo',
    'instances.columns.resourceIds': 'ID risorse',
    'instances.columns.apiVersion': 'Versione API',
    'instances.columns.created': 'Creato',
    'instances.form.displayNameLabel': 'Nome visualizzato *',
    'instances.form.displayNameHelper':
      'Nome leggibile per questa istanza sottoposta a provisioning (max 63 caratteri)',
    'instances.form.catalogItemLabel': 'Elemento del catalogo *',
    'instances.form.catalogItemSelect':
      'Seleziona un elemento del catalogo\u2026',
    'instances.form.catalogItemHelperNoItems':
      'Nessun elemento del catalogo disponibile \u2014 crea prima un elemento nella scheda Elementi del catalogo',
    'instances.form.catalogItemHelperDefault':
      'Scegli l\u2019elemento del catalogo da cui effettuare il provisioning di un\u2019istanza',
    'instances.form.apiVersionLabel': 'Versione API *',
    'instances.form.apiVersionHelper':
      'Deve seguire il pattern v<numero>[alpha|beta][numero] \u2014 p.\u00a0es. v1, v1alpha1',
    'instances.form.fieldValuesSection': 'Valori dei campi',
    'instances.form.fieldValuesSectionHint':
      '(campi modificabili definiti da questo elemento del catalogo)',
    'instances.form.noEditableFields':
      'Questo elemento del catalogo non ha campi modificabili.',
    'instances.wizard.tabOverview': 'Panoramica',
    'resources.emptyTitle': 'Nessuna risorsa trovata',
    'resources.emptyDescription':
      'Le istanze dei tipi di servizio sottoposte a provisioning tramite DCM appariranno qui.',
    'resources.cardTitle': 'Risorse ({{count}})',
    'resources.columns.id': 'ID',
    'resources.columns.serviceType': 'Tipo di servizio',
    'resources.columns.provider': 'Provider',
    'resources.columns.status': 'Stato',
    'resources.columns.created': 'Creato',
    'copyButton.copy': 'Copia',
    'copyButton.copied': 'Copiato!',
    'copyButton.failed': 'Copia non riuscita',
    'copyButton.ariaLabel': 'Copia negli appunti',
    'validation.agent.nameRequired': 'Il nome \u00e8 obbligatorio',
    'validation.agent.namePattern':
      'Sono consentiti solo lettere minuscole, numeri e trattini (deve iniziare con una lettera)',
    'validation.agent.environmentRequired': "L'ambiente \u00e8 obbligatorio",
    'validation.agent.serviceTypesRequired':
      '\u00c8 richiesto almeno un tipo di servizio',
    'validation.agent.costRequired': 'Il costo \u00e8 obbligatorio',
    'validation.agent.topicNameRequired':
      'Il nome del topic \u00e8 obbligatorio',
    'validation.agent.topicNamePattern':
      'Il nome del topic deve iniziare con dcm.agent.',
    'validation.policy.displayNameRequired':
      'Il nome visualizzato \u00e8 obbligatorio',
    'validation.policy.displayNameEmpty':
      'Il nome visualizzato non pu\u00f2 essere vuoto',
    'validation.policy.displayNameMax':
      'Il nome visualizzato deve avere al massimo 255 caratteri',
    'validation.policy.descriptionMax':
      'La descrizione deve avere al massimo 255 caratteri',
    'validation.policy.policyTypeRequired':
      'Il tipo di policy \u00e8 obbligatorio',
    'validation.policy.policyTypeOneOf': 'Deve essere GLOBAL o USER',
    'validation.policy.priorityType': 'La priorit\u00e0 deve essere un numero',
    'validation.policy.priorityRequired':
      'La priorit\u00e0 \u00e8 obbligatoria',
    'validation.policy.priorityInteger':
      'La priorit\u00e0 deve essere un numero intero',
    'validation.policy.priorityMin': 'La priorit\u00e0 deve essere almeno 1',
    'validation.policy.priorityMax':
      'La priorit\u00e0 deve essere al massimo 1000',
    'validation.policy.regoCodeRequired': 'Il codice Rego \u00e8 obbligatorio',
    'validation.policy.regoCodeEmpty':
      'Il codice Rego non pu\u00f2 essere vuoto',
    'validation.policy.regoCodePackage':
      'Deve contenere una dichiarazione di pacchetto \u2014 es. "package dcm.placement"',
    'validation.catalogItem.displayNameRequired':
      'Il nome visualizzato \u00e8 obbligatorio',
    'validation.catalogItem.displayNameEmpty':
      'Il nome visualizzato non pu\u00f2 essere vuoto',
    'validation.catalogItem.displayNameMax':
      'Il nome visualizzato deve avere al massimo 63 caratteri',
    'validation.catalogItem.apiVersionRequired':
      'La versione API \u00e8 obbligatoria',
    'validation.catalogItem.apiVersionPattern':
      'Deve seguire il formato v<numero>[alpha|beta][numero] \u2014 es. v1, v1alpha1',
    'validation.catalogItem.serviceTypeRequired':
      'Il tipo di servizio \u00e8 obbligatorio',
    'validation.catalogItem.resourceNameRequired':
      'Il nome della risorsa \u00e8 obbligatorio',
    'validation.catalogItem.resourceNameDuplicate':
      'Il nome della risorsa deve essere univoco all\u2019interno dell\u2019elemento del catalogo',
    'validation.catalogItem.resourceNamePattern':
      'Sono consentiti solo lettere, numeri, trattini e underscore (deve iniziare con una lettera)',
    'validation.catalogItem.requiresResourcesCycle':
      'Dipendenza circolare rilevata \u2014 questa risorsa si richiede indirettamente da sola',
    'validation.catalogItem.resourcesRequired':
      '\u00c8 richiesta almeno una risorsa',
    'validation.catalogItem.duplicatePath':
      'Percorso duplicato \u2014 i percorsi devono essere univoci',
    'validation.catalogItem.invalidJson':
      'JSON non valido \u2014 correggere la sintassi o usare un valore stringa semplice',
    'validation.catalogItem.schemaMustBeObject':
      'Deve essere un oggetto JSON \u2014 es. {"type":"integer"}',
    'validation.catalogItem.schemaMinMaxConflict':
      'Il minimo ({{min}}) non deve superare il massimo ({{max}})',
    'validation.catalogItem.defaultBelowMin':
      'Il valore predefinito ({{value}}) \u00e8 inferiore al minimo dello schema ({{min}})',
    'validation.catalogItem.defaultAboveMax':
      'Il valore predefinito ({{value}}) supera il massimo dello schema ({{max}})',
    'validation.catalogItem.schemaInvalidJson': 'Sintassi JSON non valida',
    'validation.instance.displayNameRequired':
      'Il nome visualizzato \u00e8 obbligatorio',
    'validation.instance.displayNameEmpty':
      'Il nome visualizzato non pu\u00f2 essere vuoto',
    'validation.instance.displayNameMax':
      'Il nome visualizzato deve avere al massimo 63 caratteri',
    'validation.instance.catalogItemRequired':
      "L'elemento di catalogo \u00e8 obbligatorio",
    'validation.instance.apiVersionRequired':
      'La versione API \u00e8 obbligatoria',
    'validation.instance.apiVersionPattern':
      'Deve seguire il formato v<numero>[alpha|beta][numero] \u2014 es. v1, v1alpha1',
    'validation.instance.fieldRequired': 'Questo campo \u00e8 obbligatorio',
    'validation.instance.fieldMustBeNumber': 'Deve essere un numero valido',
    'validation.instance.fieldMin': 'Deve essere almeno {{min}}',
    'validation.instance.fieldMax': 'Deve essere al massimo {{max}}',
  },
});

export default dcmTranslationIt;
