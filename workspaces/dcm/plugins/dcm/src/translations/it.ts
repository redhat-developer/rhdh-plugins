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
    'page.tabs.providers': 'Provider',
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
    'common.emDash': '\u2014',
    'deleteDialog.title': 'Elimina {{resourceLabel}}',
    'deleteDialog.confirmButton': 'Elimina',
    'deleteDialog.cancelButton': 'Annulla',
    'deleteDialog.body':
      'Eliminare {{resourceName}}? Questa azione non pu\u00f2 essere annullata.',
    'providers.emptyTitle': 'Nessun provider registrato',
    'providers.emptyDescription':
      'Registra un provider di servizi per consentire a DCM di effettuare il provisioning di risorse su infrastrutture esterne (p.\u00a0es. OpenShift, AWS).',
    'providers.registerButton': 'Registra',
    'providers.entityLabel': 'Provider',
    'providers.registerDialogTitle': 'Registra provider',
    'providers.editDialogTitle': 'Modifica provider',
    'providers.saveButton': 'Salva',
    'providers.createSuccess': 'Provider registrato correttamente.',
    'providers.updateSuccess': 'Provider aggiornato correttamente.',
    'providers.deleteSuccess': 'Provider eliminato correttamente.',
    'providers.deleteLabel': 'provider',
    'providers.columns.displayName': 'Nome visualizzato',
    'providers.columns.name': 'Nome',
    'providers.columns.endpoint': 'Endpoint',
    'providers.columns.serviceType': 'Tipo di servizio',
    'providers.columns.operations': 'Operazioni',
    'providers.columns.status': 'Stato',
    'providers.form.nameLabel': 'Nome *',
    'providers.form.namePlaceholder': 'es. mio-provider-k8s',
    'providers.form.nameHelper':
      'Identificatore univoco \u2014 solo lettere minuscole, numeri e trattini',
    'providers.form.nameHelperEditMode':
      'Il nome del provider non pu\u00f2 essere modificato dopo la creazione',
    'providers.form.endpointLabel': 'Endpoint *',
    'providers.form.endpointPlaceholder': 'https://api.esempio.com',
    'providers.form.endpointHelper':
      'URL completo dell\u2019API del provider (p.\u00a0es. https://api.esempio.com)',
    'providers.form.serviceTypeLabel': 'Tipo di servizio *',
    'providers.form.serviceTypeEmpty': 'Nessun tipo di servizio disponibile',
    'providers.form.serviceTypeSelect': 'Seleziona un tipo di servizio\u2026',
    'providers.form.serviceTypeHelperNoTypes':
      'Crea prima un tipo di servizio nella scheda Tipi di servizio',
    'providers.form.serviceTypeHelperDefault':
      'Seleziona dai tipi di servizio registrati',
    'providers.form.schemaVersionLabel': 'Versione schema *',
    'providers.form.schemaVersionHelper':
      'p.\u00a0es. v1, v1alpha1, v2beta2 \u2014 solo v<numero>[alpha|beta][numero]',
    'providers.form.operationsLabel': 'Operazioni',
    'providers.form.operationsHelper':
      'Seleziona le operazioni supportate da questo provider',
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
    'catalogItems.columns.serviceType': 'Tipo di servizio',
    'catalogItems.columns.fields': 'Campi',
    'catalogItems.columns.created': 'Creato',
    'catalogItems.fieldCount.one': '1 campo',
    'catalogItems.fieldCount.other': '{{count}} campi',
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
    'instances.columns.resourceId': 'ID risorsa',
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
  },
});

export default dcmTranslationIt;
