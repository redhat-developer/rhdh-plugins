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

const dcmTranslationDe: TranslationMessages<
  'plugin.dcm',
  Record<string, string>
> = createTranslationMessages({
  ref: dcmTranslationRef,
  messages: {
    'page.title': 'Rechenzentrum',
    'page.tabs.agents': 'Agents',
    'page.tabs.policies': 'Richtlinien',
    'page.tabs.serviceTypes': 'Servicetypen',
    'page.tabs.catalogItems': 'Katalogelemente',
    'page.tabs.instances': 'Instanzen',
    'page.tabs.resources': 'Ressourcen',
    'common.retry': 'Erneut versuchen',
    'common.refresh': 'Aktualisieren',
    'common.search': 'Suchen',
    'common.clearSearch': 'Suche löschen',
    'common.edit': 'Bearbeiten',
    'common.delete': 'Löschen',
    'common.actions': 'Aktionen',
    'common.cancel': 'Abbrechen',
    'common.save': 'Speichern',
    'common.saving': 'Wird gespeichert…',
    'common.close': 'Schließen',
    'common.rows': 'Zeilen',
    'common.previousPage': 'Zurück',
    'common.nextPage': 'Weiter',
    'common.next': 'Weiter',
    'common.back': 'Zurück',
    'common.loadingMore': 'Mehr wird geladen…',
    'deleteDialog.title': '{{resourceLabel}} löschen',
    'deleteDialog.confirmButton': 'Löschen',
    'deleteDialog.cancelButton': 'Abbrechen',
    'deleteDialog.body':
      'Möchten Sie {{resourceName}} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
    'agents.emptyTitle': 'Keine Agents registriert',
    'agents.emptyDescription':
      'Umgebungs-Agents registrieren sich bei der Steuerungsebene und senden periodische Heartbeats. Registrieren Sie einen Agent, damit DCM Arbeitsauslastungen in externen Umgebungen verwalten kann.',
    'agents.registerButton': 'Registrieren',
    'agents.entityLabel': 'Agents',
    'agents.registerDialogTitle': 'Agent registrieren',
    'agents.createSuccess': 'Agent erfolgreich registriert.',
    'agents.columns.name': 'Name',
    'agents.columns.environment': 'Umgebung',
    'agents.columns.serviceTypes': 'Servicetypen',
    'agents.columns.cost': 'Kosten',
    'agents.columns.topic': 'Thema',
    'agents.columns.health': 'Integrität',
    'agents.columns.lastHeartbeat': 'Letzter Heartbeat',
    'agents.filter.healthLabel': 'Integritätsstatus',
    'agents.filter.healthAll': 'Alle',
    'agents.filter.healthReady': 'Bereit',
    'agents.filter.healthCongested': 'Überlastet',
    'agents.filter.healthUnavailable': 'Nicht verfügbar',
    'agents.form.nameLabel': 'Name*',
    'agents.form.namePlaceholder': 'z. B. env-agent-west-1',
    'agents.form.nameHelper':
      'Eindeutige Slug-Kennung – nur Kleinbuchstaben, Zahlen und Bindestriche',
    'agents.form.environmentLabel': 'Umgebung*',
    'agents.form.environmentPlaceholder': 'z. B. Produktion',
    'agents.form.environmentHelper': 'Umgebungsbezeichnung für den Agent',
    'agents.form.serviceTypesLabel': 'Servicetypen*',
    'agents.form.serviceTypesHelper':
      'Servicetypen, die dieser Agent bereitstellen kann',
    'agents.form.costLabel': 'Kosten*',
    'agents.form.costHelper':
      'Relative Kostengewichtung für Platzierungsentscheidungen',
    'agents.form.topicNameLabel': 'Themenname*',
    'agents.form.topicNamePlaceholder': 'z. B. dcm.agent.env-agent-west-1',
    'agents.form.topicNameHelper':
      'NATS-Themenname; muss mit dcm.agent beginnen.',
    'policies.emptyTitle': 'Keine Richtlinien definiert',
    'policies.emptyDescription':
      'Erstellen Sie OPA Rego-Richtlinien, um Governance-Regeln für DCM-Ressourcen durchzusetzen. Richtlinien können global oder pro Benutzer festgelegt werden.',
    'policies.createButton': 'Erstellen',
    'policies.entityLabel': 'Richtlinien',
    'policies.createDialogTitle': 'Richtlinie erstellen',
    'policies.editDialogTitle': 'Richtlinie bearbeiten',
    'policies.saveButton': 'Speichern',
    'policies.createSuccess': 'Richtlinie erfolgreich erstellt.',
    'policies.updateSuccess': 'Richtlinie erfolgreich aktualisiert.',
    'policies.deleteSuccess': 'Richtlinie erfolgreich gelöscht.',
    'policies.deleteLabel': 'Richtlinie',
    'policies.enabledYes': 'Ja',
    'policies.enabledNo': 'Nein',
    'policies.toggleDisable': 'Richtlinie deaktivieren',
    'policies.toggleEnable': 'Richtlinie aktivieren',
    'policies.toggleDisableAria': 'Deaktivieren',
    'policies.toggleEnableAria': 'Aktivieren',
    'policies.columns.displayName': 'Anzeigename',
    'policies.columns.type': 'Typ',
    'policies.columns.priority': 'Priorität',
    'policies.columns.enabled': 'Aktiviert',
    'policies.columns.description': 'Beschreibung',
    'policies.form.displayNameLabel': 'Anzeigename*',
    'policies.form.displayNameHelper':
      'Für Menschen lesbarer Name für diese Richtlinie',
    'policies.form.descriptionLabel': 'Beschreibung',
    'policies.form.descriptionHelper':
      'Optional – Beschreiben Sie den Zweck dieser Richtlinie',
    'policies.form.policyTypeLabel': 'Richtlinientyp*',
    'policies.form.policyTypeGlobal': 'GLOBAL – gilt für alle Anforderungen',
    'policies.form.policyTypeUser': 'BENUTZER – gilt pro Benutzer',
    'policies.form.priorityLabel': 'Priorität*',
    'policies.form.priorityHelper':
      '1 (höchster Wert) – 1000 (niedrigster Wert), Standardwert 500 – muss pro Richtlinientyp eindeutig sein',
    'policies.form.regoCodeLabel': 'Rego-Code*',
    'policies.form.regoCodeHelper':
      'Die OPA Rego-Richtlinie wird vom Platzierungsmanager bewertet.',
    'policies.form.regoCodePlaceholder': 'Paket dcm.placement',
    'policies.form.enabledLabel': 'Aktiviert',
    'serviceTypes.emptyTitle': 'Keine Servicetypen definiert',
    'serviceTypes.emptyDescription':
      'Servicetypen definieren das Vorlagenschema für Katalogelemente.',
    'serviceTypes.cardTitle': 'Servicetypen ({{count}})',
    'serviceTypes.columns.serviceType': 'Servicetyp',
    'serviceTypes.columns.apiVersion': 'API-Version',
    'serviceTypes.columns.path': 'Pfad',
    'serviceTypes.columns.created': 'Erstellt',
    'catalogItems.emptyTitle': 'Keine Katalogelemente definiert',
    'catalogItems.emptyDescription':
      'Katalogelemente sind Servicevorlagen, die Entwickler bereitstellen können. Jedes Katalogelement verweist auf einen oder mehrere Servicetypen und definiert die Felder, die zur Anpassung zur Verfügung stehen.',
    'catalogItems.createButton': 'Erstellen',
    'catalogItems.entityLabel': 'Katalogelemente',
    'catalogItems.createDrawerTitle': 'Katalogelement erstellen',
    'catalogItems.editDrawerTitle': 'Katalogelement bearbeiten',
    'catalogItems.saveButton': 'Speichern',
    'catalogItems.createSuccess': 'Katalogelement erfolgreich erstellt.',
    'catalogItems.updateSuccess': 'Katalogeintrag erfolgreich aktualisiert.',
    'catalogItems.deleteSuccess': 'Katalogelement erfolgreich gelöscht.',
    'catalogItems.deleteLabel': 'Katalogelement',
    'catalogItems.columns.displayName': 'Anzeigename',
    'catalogItems.columns.apiVersion': 'API-Version',
    'catalogItems.columns.resources': 'Ressourcen',
    'catalogItems.columns.fields': 'Felder',
    'catalogItems.columns.created': 'Erstellt',
    'catalogItems.fieldCount_one': '1 Feld',
    'catalogItems.fieldCount_other': '{{count}} Felder',
    'catalogItems.resourceCount_one': '1 Ressource',
    'catalogItems.resourceCount_other': '{{count}} Ressourcen',
    'catalogItems.form.importButton': 'Aus Datei importieren',
    'catalogItems.form.importTooltip':
      'Füllen Sie das Formular anhand einer JSON- oder YAML-Katalogelementdefinition aus',
    'catalogItems.form.importError':
      'Datei konnte nicht importiert werden – überprüfen Sie, ob es sich um gültiges JSON oder YAML handelt.',
    'catalogItems.form.displayNameLabel': 'Anzeigename*',
    'catalogItems.form.displayNameHelper':
      'Für Menschen lesbarer Name für dieses Katalogelement (max. 63 Zeichen)',
    'catalogItems.form.apiVersionLabel': 'API-Version*',
    'catalogItems.form.apiVersionHelper':
      'Muss dem Muster v<number>[alpha|beta][Zahl] folgen – z. B. v1, v1alpha1',
    'catalogItems.form.serviceTypeLabel': 'Servicetyp*',
    'catalogItems.form.serviceTypeHelperEdit':
      'Der Servicetyp kann nach seiner Erstellung nicht mehr geändert werden',
    'catalogItems.form.serviceTypeHelperNoTypes':
      'Keine Servicetypen verfügbar – erstellen Sie einen auf der Registerkarte „Servicetypen“',
    'catalogItems.form.serviceTypeHelperDefault':
      'Wählen Sie den Servicetyp aus, auf dem diese Ressource basiert',
    'catalogItems.form.fieldsLabel': 'Felder*',
    'catalogItems.form.fieldsCaption': '(mindestens eines erforderlich)',
    'catalogItems.form.fieldsErrorEmpty':
      'Fügen Sie mindestens ein Feld mit einem nicht leeren Pfad hinzu.',
    'catalogItems.form.fieldAddButton': 'Feld hinzufügen',
    'catalogItems.form.fieldAddTooltip':
      'Füllen Sie den Pfad des letzten Feldes aus, bevor Sie ein neues hinzufügen',
    'catalogItems.form.fieldPathLabel': 'Pfad*',
    'catalogItems.form.fieldPathHelper': 'z. B. config.replicas',
    'catalogItems.form.fieldDisplayNameLabel': 'Anzeigename',
    'catalogItems.form.fieldEditableLabel': 'Bearbeitbar',
    'catalogItems.form.fieldDefaultValueLabel': 'Standardwert',
    'catalogItems.form.fieldDefaultValueHelper':
      'Beliebiger JSON-Wert – z. B. 42, "hello", true, [1,2]',
    'catalogItems.form.fieldRemoveAriaLabel': 'Feld entfernen',
    'catalogItems.form.schemaLabel': 'Validierungsschema',
    'catalogItems.form.schemaEditButton': 'JSON bearbeiten',
    'catalogItems.form.schemaAddButton': 'JSON hinzufügen',
    'catalogItems.form.schemaDialogTitle': 'Validierungsschema',
    'catalogItems.form.schemaDialogHelper':
      'JSON-Schema-Objekt – z. B. {"type":"integer","minimum":0}',
    'catalogItems.form.schemaDialogCancel': 'Abbrechen',
    'catalogItems.form.schemaDialogApply': 'Anwenden',
    'catalogItems.form.schemaMustBeObject':
      'Muss ein JSON-Objekt sein, kein Array oder Grundtyp',
    'catalogItems.form.schemaInvalidJson': 'Ungültige JSON-Syntax',
    'catalogItems.wizard.tabOverview': 'Übersicht',
    'catalogItems.wizard.tabApi': 'API',
    'catalogItems.wizard.tabResources': 'Ressourcen',
    'catalogItems.wizard.resourcesDescription':
      'Fügen Sie eine oder mehrere Ressourcen hinzu. Jede Ressource referenziert einen Servicetyp und definiert ihre eigenen Feldkonfigurationen.',
    'catalogItems.wizard.resourcesRequired':
      'Mindestens eine Ressource ist erforderlich.',
    'catalogItems.wizard.addResourceButton': 'Ressource hinzufügen',
    'catalogItems.wizard.removeResource': 'Ressource entfernen',
    'catalogItems.wizard.unnamedResource': '(unbenannt)',
    'catalogItems.wizard.resourceNameLabel': 'Ressourcenname*',
    'catalogItems.wizard.resourceNameHelper':
      'Eindeutige Kennung innerhalb dieses Katalogelements – z. B. app, ordersDb',
    'catalogItems.wizard.requiresResourcesLabel': 'Erfordert Ressourcen',
    'catalogItems.wizard.requiresResourcesHelper':
      'Wählen Sie andere Ressourcen aus, die vor dieser bereitgestellt werden müssen',
    'catalogItems.wizard.apiVersionImmutable':
      'Die API-Version kann nach der Erstellung nicht mehr geändert werden',
    'instances.emptyTitle': 'Keine Instanzen bereitgestellt',
    'instances.emptyDescription':
      'Katalogelementinstanzen stellen bereitgestellte Services dar. Erstellen Sie eine Instanz aus einem Katalogelement, um einen Service für einen registrierten Umgebungs-Agent bereitzustellen.',
    'instances.createButton': 'Erstellen',
    'instances.entityLabel': 'Katalogelementinstanzen',
    'instances.createDialogTitle': 'Katalogelementinstanz erstellen',
    'instances.rehydrateSuccess':
      'Katalogelementinstanz erfolgreich wiederhergestellt.',
    'instances.deleteLabel': 'Instanz',
    'instances.rehydrateTooltip': 'Wiederherstellen',
    'instances.rehydrateAriaLabel': 'Instanz wiederherstellen',
    'instances.deleteTooltip': 'Löschen',
    'instances.deleteAriaLabel': 'Instanz löschen',
    'instances.rehydrateDialogTitle': 'Instanz wiederherstellen?',
    'instances.rehydrateDialogBody':
      'Durch das Wiederherstellen von {{instanceName}} wird die Ressource erneut bereitgestellt und ggf. eine neue Ressourcen-ID zugewiesen. Diese Aktion kann nicht rückgängig gemacht werden.',
    'instances.rehydrateDialogFallbackName': 'diese Instanz',
    'instances.rehydrateDialogCancel': 'Abbrechen',
    'instances.rehydrateDialogConfirm': 'Wiederherstellen',
    'instances.columns.displayName': 'Anzeigename',
    'instances.columns.catalogItem': 'Katalogelement',
    'instances.columns.resourceIds': 'Ressourcen-IDs',
    'instances.columns.apiVersion': 'API-Version',
    'instances.columns.created': 'Erstellt',
    'instances.form.displayNameLabel': 'Anzeigename*',
    'instances.form.displayNameHelper':
      'Für Menschen lesbarer Name für diese bereitgestellte Instanz (max. 63 Zeichen)',
    'instances.form.catalogItemLabel': 'Katalogelement*',
    'instances.form.catalogItemSelect': 'Wählen Sie ein Katalogelement aus…',
    'instances.form.catalogItemHelperNoItems':
      'Es sind keine Katalogelemente verfügbar – erstellen Sie eines auf der Registerkarte „Katalogelemente“.',
    'instances.form.catalogItemHelperDefault':
      'Wählen Sie das Katalogelement aus, aus dem Sie eine Instanz bereitstellen möchten',
    'instances.form.apiVersionLabel': 'API-Version*',
    'instances.form.apiVersionHelper':
      'Muss dem Muster v<number>[alpha|beta][Zahl] folgen – z. B. v1, v1alpha1',
    'instances.form.fieldValuesSection': 'Feldwerte',
    'instances.form.fieldValuesSectionHint':
      '(bearbeitbare Felder, die durch dieses Katalogelement definiert werden)',
    'instances.form.noEditableFields':
      'Diese Ressource enthält keine bearbeitbaren Felder.',
    'instances.wizard.tabOverview': 'Übersicht',
    'resources.emptyTitle': 'Keine Ressourcen gefunden',
    'resources.emptyDescription':
      'Hier werden die über DCM bereitgestellten Servicetyp-Instanzen angezeigt.',
    'resources.cardTitle': 'Ressourcen ({{count}})',
    'resources.columns.id': 'ID',
    'resources.columns.serviceType': 'Servicetyp',
    'resources.columns.provider': 'Anbieter',
    'resources.columns.status': 'Status',
    'resources.columns.created': 'Erstellt',
    'copyButton.copy': 'Kopieren',
    'copyButton.copied': 'Kopiert!',
    'copyButton.failed': 'Kopieren fehlgeschlagen',
    'copyButton.ariaLabel': 'In die Zwischenablage kopieren',
    'validation.agent.nameRequired': 'Name ist erforderlich',
    'validation.agent.namePattern':
      'Zulässig sind nur Kleinbuchstaben, Zahlen und Bindestriche (muss mit einem Buchstaben beginnen)',
    'validation.agent.environmentRequired': 'Umgebung ist erforderlich',
    'validation.agent.serviceTypesRequired':
      'Mindestens ein Servicetyp ist erforderlich.',
    'validation.agent.costRequired': 'Kosten ist erforderlich',
    'validation.agent.topicNameRequired': 'Themenname ist erforderlich',
    'validation.agent.topicNamePattern':
      'Der Themenname muss mit dcm.agent beginnen.',
    'validation.policy.displayNameRequired': 'Anzeigename ist erforderlich',
    'validation.policy.displayNameEmpty': 'Anzeigename darf nicht leer sein',
    'validation.policy.displayNameMax':
      'Der Anzeigename darf max. 255 Zeichen lang sein',
    'validation.policy.descriptionMax':
      'Die Beschreibung darf max. 255 Zeichen lang sein',
    'validation.policy.policyTypeRequired': 'Richtlinientyp ist erforderlich',
    'validation.policy.policyTypeOneOf': 'Muss GLOBAL oder BENUTZER sein',
    'validation.policy.priorityType': 'Priorität muss eine Zahl sein',
    'validation.policy.priorityRequired': 'Priorität ist erforderlich',
    'validation.policy.priorityInteger': 'Priorität muss eine ganze Zahl sein',
    'validation.policy.priorityMin': 'Priorität muss mindestens 1 sein',
    'validation.policy.priorityMax': 'Priorität darf höchstens 1000 sein',
    'validation.policy.regoCodeRequired': 'Rego-Code ist erforderlich',
    'validation.policy.regoCodeEmpty': 'Rego-Code darf nicht leer sein',
    'validation.policy.regoCodePackage':
      'Muss eine Paketdeklaration enthalten – z. B. „package dcm.placement“',
    'validation.catalogItem.displayNameRequired':
      'Anzeigename ist erforderlich',
    'validation.catalogItem.displayNameEmpty':
      'Anzeigename darf nicht leer sein',
    'validation.catalogItem.displayNameMax':
      'Der Anzeigename darf max. 63 Zeichen lang sein',
    'validation.catalogItem.apiVersionRequired': 'API-Version ist erforderlich',
    'validation.catalogItem.apiVersionPattern':
      'Muss dem Muster v<number>[alpha|beta][Zahl] folgen – z. B. v1, v1alpha1',
    'validation.catalogItem.serviceTypeRequired': 'Servicetyp ist erforderlich',
    'validation.catalogItem.resourceNameRequired':
      'Ressourcenname ist erforderlich',
    'validation.catalogItem.resourceNameDuplicate':
      'Ressourcenname muss innerhalb des Katalogelements eindeutig sein',
    'validation.catalogItem.resourceNamePattern':
      'Zulässig sind nur Buchstaben, Zahlen, Bindestriche und Unterstriche (muss mit einem Buchstaben beginnen)',
    'validation.catalogItem.requiresResourcesCycle':
      'Zirkuläre Abhängigkeit erkannt – diese Ressource benötigt sich indirekt selbst',
    'validation.catalogItem.resourcesRequired':
      'Mindestens eine Ressource ist erforderlich',
    'validation.catalogItem.duplicatePath':
      'Doppelter Pfad – Pfade müssen eindeutig sein',
    'validation.catalogItem.invalidJson':
      'JSON ungültig – korrigieren Sie die Syntax oder verwenden Sie einen einfachen Zeichenkettenwert',
    'validation.catalogItem.schemaMustBeObject':
      'Muss ein JSON-Objekt sein – z. B. {"type":"integer"}',
    'validation.catalogItem.schemaMinMaxConflict':
      'Der Minimalwert ({{min}}) darf den Maximalwert ({{max}}) nicht überschreiten',
    'validation.catalogItem.defaultBelowMin':
      'Der Standardwert ({{value}}) liegt unter dem Schemamindestwert ({{min}}).',
    'validation.catalogItem.defaultAboveMax':
      'Der Standardwert ({{value}}) überschreitet den Schemahöchstwert ({{max}}).',
    'validation.catalogItem.schemaInvalidJson': 'Ungültige JSON-Syntax',
    'validation.instance.displayNameRequired': 'Anzeigename ist erforderlich',
    'validation.instance.displayNameEmpty': 'Anzeigename darf nicht leer sein',
    'validation.instance.displayNameMax':
      'Der Anzeigename darf max. 63 Zeichen lang sein',
    'validation.instance.catalogItemRequired':
      'Katalogelement ist erforderlich',
    'validation.instance.apiVersionRequired': 'API-Version ist erforderlich',
    'validation.instance.apiVersionPattern':
      'Muss dem Muster v<number>[alpha|beta][Zahl] folgen – z. B. v1, v1alpha1',
    'validation.instance.fieldRequired': 'Dieses Feld ist erforderlich',
    'validation.instance.fieldMustBeNumber': 'Muss eine gültige Nummer sein',
    'validation.instance.fieldMin': 'Muss mindestens {{min}} sein',
    'validation.instance.fieldMax': 'Darf höchstens {{max}} sein',
  },
});

export default dcmTranslationDe;
