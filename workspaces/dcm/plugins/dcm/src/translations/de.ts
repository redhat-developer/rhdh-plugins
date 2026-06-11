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
    'page.tabs.providers': 'Anbieter',
    'page.tabs.policies': 'Richtlinien',
    'page.tabs.serviceTypes': 'Diensttypen',
    'page.tabs.catalogItems': 'Katalogelemente',
    'page.tabs.instances': 'Instanzen',
    'page.tabs.resources': 'Ressourcen',
    'common.retry': 'Wiederholen',
    'common.refresh': 'Aktualisieren',
    'common.search': 'Suchen',
    'common.clearSearch': 'Suche l\u00f6schen',
    'common.edit': 'Bearbeiten',
    'common.delete': 'L\u00f6schen',
    'common.actions': 'Aktionen',
    'common.cancel': 'Abbrechen',
    'common.save': 'Speichern',
    'common.saving': 'Wird gespeichert\u2026',
    'common.close': 'Schlie\u00dfen',
    'common.rows': 'Zeilen',
    'deleteDialog.title': '{{resourceLabel}} l\u00f6schen',
    'deleteDialog.confirmButton': 'L\u00f6schen',
    'deleteDialog.cancelButton': 'Abbrechen',
    'deleteDialog.bodyBefore': 'M\u00f6chten Sie ',
    'deleteDialog.bodyAfter':
      ' wirklich l\u00f6schen? Diese Aktion kann nicht r\u00fcckg\u00e4ngig gemacht werden.',
    'providers.emptyTitle': 'Keine Anbieter registriert',
    'providers.emptyDescription':
      'Registrieren Sie einen Dienstanbieter, damit DCM Ressourcen auf externer Infrastruktur bereitstellen kann (z.\u00a0B. OpenShift, AWS).',
    'providers.registerButton': 'Registrieren',
    'providers.entityLabel': 'Anbieter',
    'providers.registerDialogTitle': 'Anbieter registrieren',
    'providers.editDialogTitle': 'Anbieter bearbeiten',
    'providers.saveButton': 'Speichern',
    'providers.createSuccess': 'Anbieter erfolgreich registriert.',
    'providers.updateSuccess': 'Anbieter erfolgreich aktualisiert.',
    'providers.deleteSuccess': 'Anbieter erfolgreich gel\u00f6scht.',
    'providers.deleteLabel': 'Anbieter',
    'providers.columns.displayName': 'Anzeigename',
    'providers.columns.name': 'Name',
    'providers.columns.endpoint': 'Endpunkt',
    'providers.columns.serviceType': 'Diensttyp',
    'providers.columns.operations': 'Operationen',
    'providers.columns.status': 'Status',
    'providers.form.nameLabel': 'Name *',
    'providers.form.namePlaceholder': 'z.\u00a0B. mein-k8s-anbieter',
    'providers.form.nameHelper':
      'Eindeutiger Slug \u2014 nur Kleinbuchstaben, Zahlen und Bindestriche',
    'providers.form.nameHelperEditMode':
      'Der Anbietername kann nach der Erstellung nicht ge\u00e4ndert werden',
    'providers.form.endpointLabel': 'Endpunkt *',
    'providers.form.endpointPlaceholder': 'https://api.beispiel.de',
    'providers.form.endpointHelper':
      'Vollst\u00e4ndige URL der Anbieter-API (z.\u00a0B. https://api.beispiel.de)',
    'providers.form.serviceTypeLabel': 'Diensttyp *',
    'providers.form.serviceTypeEmpty': 'Keine Diensttypen verf\u00fcgbar',
    'providers.form.serviceTypeSelect': 'Diensttyp ausw\u00e4hlen\u2026',
    'providers.form.serviceTypeHelperNoTypes':
      'Erstellen Sie zuerst einen Diensttyp im Reiter Diensttypen',
    'providers.form.serviceTypeHelperDefault':
      'Aus registrierten Diensttypen ausw\u00e4hlen',
    'providers.form.schemaVersionLabel': 'Schema-Version *',
    'providers.form.schemaVersionHelper':
      'z.\u00a0B. v1, v1alpha1, v2beta2 \u2014 nur v<Zahl>[alpha|beta][Zahl]',
    'providers.form.operationsLabel': 'Operationen',
    'providers.form.operationsHelper':
      'Die von diesem Anbieter unterst\u00fctzten Operationen ausw\u00e4hlen',
    'policies.emptyTitle': 'Keine Richtlinien definiert',
    'policies.emptyDescription':
      'Erstellen Sie OPA-Rego-Richtlinien, um Governance-Regeln f\u00fcr DCM-Ressourcen durchzusetzen.',
    'policies.createButton': 'Erstellen',
    'policies.entityLabel': 'Richtlinien',
    'policies.createDialogTitle': 'Richtlinie erstellen',
    'policies.editDialogTitle': 'Richtlinie bearbeiten',
    'policies.saveButton': 'Speichern',
    'policies.createSuccess': 'Richtlinie erfolgreich erstellt.',
    'policies.updateSuccess': 'Richtlinie erfolgreich aktualisiert.',
    'policies.deleteSuccess': 'Richtlinie erfolgreich gel\u00f6scht.',
    'policies.deleteLabel': 'Richtlinie',
    'policies.enabledYes': 'Ja',
    'policies.enabledNo': 'Nein',
    'policies.toggleDisable': 'Richtlinie deaktivieren',
    'policies.toggleEnable': 'Richtlinie aktivieren',
    'policies.toggleDisableAria': 'Deaktivieren',
    'policies.toggleEnableAria': 'Aktivieren',
    'policies.columns.displayName': 'Anzeigename',
    'policies.columns.type': 'Typ',
    'policies.columns.priority': 'Priorit\u00e4t',
    'policies.columns.enabled': 'Aktiviert',
    'policies.columns.description': 'Beschreibung',
    'policies.form.displayNameLabel': 'Anzeigename *',
    'policies.form.displayNameHelper':
      'Lesbarer Name f\u00fcr diese Richtlinie',
    'policies.form.descriptionLabel': 'Beschreibung',
    'policies.form.descriptionHelper':
      'Optional \u2014 Zweck dieser Richtlinie beschreiben',
    'policies.form.policyTypeLabel': 'Richtlinientyp *',
    'policies.form.policyTypeGlobal':
      'GLOBAL \u2014 gilt f\u00fcr alle Anfragen',
    'policies.form.policyTypeUser': 'USER \u2014 gilt pro Benutzer',
    'policies.form.priorityLabel': 'Priorit\u00e4t *',
    'policies.form.priorityHelper':
      '1 (h\u00f6chste) \u2013 1000 (niedrigste), Standard 500',
    'policies.form.regoCodeLabel': 'Rego-Code *',
    'policies.form.regoCodeHelper':
      'OPA-Rego-Richtlinie, die vom Placement Manager ausgewertet wird.',
    'policies.form.regoCodePlaceholder': 'package dcm.placement',
    'policies.form.enabledLabel': 'Aktiviert',
    'serviceTypes.emptyTitle': 'Keine Diensttypen definiert',
    'serviceTypes.emptyDescription':
      'Diensttypen definieren das Vorlagenschema f\u00fcr Katalogelemente.',
    'serviceTypes.cardTitle': 'Diensttypen ({{count}})',
    'serviceTypes.columns.serviceType': 'Diensttyp',
    'serviceTypes.columns.apiVersion': 'API-Version',
    'serviceTypes.columns.path': 'Pfad',
    'serviceTypes.columns.created': 'Erstellt',
    'catalogItems.emptyTitle': 'Keine Katalogelemente definiert',
    'catalogItems.emptyDescription':
      'Katalogelemente sind Dienstvorlagen, die Entwickler bereitstellen k\u00f6nnen.',
    'catalogItems.createButton': 'Erstellen',
    'catalogItems.entityLabel': 'Katalogelemente',
    'catalogItems.createDrawerTitle': 'Katalogelement erstellen',
    'catalogItems.editDrawerTitle': 'Katalogelement bearbeiten',
    'catalogItems.saveButton': 'Speichern',
    'catalogItems.createSuccess': 'Katalogelement erfolgreich erstellt.',
    'catalogItems.updateSuccess': 'Katalogelement erfolgreich aktualisiert.',
    'catalogItems.deleteSuccess': 'Katalogelement erfolgreich gel\u00f6scht.',
    'catalogItems.deleteLabel': 'Katalogelement',
    'catalogItems.columns.displayName': 'Anzeigename',
    'catalogItems.columns.apiVersion': 'API-Version',
    'catalogItems.columns.serviceType': 'Diensttyp',
    'catalogItems.columns.fields': 'Felder',
    'catalogItems.columns.created': 'Erstellt',
    'catalogItems.fieldCount_one': '1 Feld',
    'catalogItems.fieldCount_other': '{{count}} Felder',
    'catalogItems.form.importButton': 'Aus Datei importieren',
    'catalogItems.form.importTooltip':
      'Formular aus einer JSON- oder YAML-Katalogelementdefinition f\u00fcllen',
    'catalogItems.form.importError':
      'Datei konnte nicht importiert werden \u2014 \u00fcberpr\u00fcfen Sie, ob es sich um g\u00fcltiges JSON oder YAML handelt.',
    'catalogItems.form.displayNameLabel': 'Anzeigename *',
    'catalogItems.form.displayNameHelper':
      'Lesbarer Name f\u00fcr dieses Katalogelement (max. 63 Zeichen)',
    'catalogItems.form.apiVersionLabel': 'API-Version *',
    'catalogItems.form.apiVersionHelper':
      'Muss dem Muster v<Zahl>[alpha|beta][Zahl] folgen \u2014 z.\u00a0B. v1, v1alpha1',
    'catalogItems.form.serviceTypeLabel': 'Diensttyp *',
    'catalogItems.form.serviceTypeHelperEdit':
      'Der Diensttyp kann nach der Erstellung nicht ge\u00e4ndert werden',
    'catalogItems.form.serviceTypeHelperNoTypes':
      'Keine Diensttypen verf\u00fcgbar \u2014 erstellen Sie einen im Reiter Diensttypen',
    'catalogItems.form.serviceTypeHelperDefault':
      'Den Diensttyp ausw\u00e4hlen, auf dem dieses Element basiert',
    'catalogItems.form.fieldsLabel': 'Felder *',
    'catalogItems.form.fieldsCaption': '(mindestens eines erforderlich)',
    'catalogItems.form.fieldsErrorEmpty':
      'F\u00fcgen Sie mindestens ein Feld mit einem nicht leeren Pfad hinzu.',
    'catalogItems.form.fieldAddButton': 'Feld hinzuf\u00fcgen',
    'catalogItems.form.fieldAddTooltip':
      'F\u00fcllen Sie den Pfad des letzten Felds aus, bevor Sie ein neues hinzuf\u00fcgen',
    'catalogItems.form.fieldPathLabel': 'Pfad *',
    'catalogItems.form.fieldPathHelper': 'z.\u00a0B. config.replicas',
    'catalogItems.form.fieldDisplayNameLabel': 'Anzeigename',
    'catalogItems.form.fieldEditableLabel': 'Bearbeitbar',
    'catalogItems.form.fieldDefaultValueLabel': 'Standardwert',
    'catalogItems.form.fieldDefaultValueHelper':
      'Beliebiger JSON-Wert \u2014 z.\u00a0B. 42, "hallo", true, [1,2]',
    'catalogItems.form.fieldRemoveAriaLabel': 'Feld entfernen',
    'catalogItems.form.schemaLabel': 'Validierungsschema',
    'catalogItems.form.schemaEditButton': 'JSON bearbeiten',
    'catalogItems.form.schemaAddButton': 'JSON hinzuf\u00fcgen',
    'catalogItems.form.schemaDialogTitle': 'Validierungsschema',
    'catalogItems.form.schemaDialogHelper':
      'JSON-Schema-Objekt \u2014 z.\u00a0B. {"type":"integer","minimum":0}',
    'catalogItems.form.schemaDialogCancel': 'Abbrechen',
    'catalogItems.form.schemaDialogApply': 'Anwenden',
    'catalogItems.form.schemaMustBeObject':
      'Muss ein JSON-Objekt sein, kein Array oder primitiver Wert',
    'catalogItems.form.schemaInvalidJson': 'Ung\u00fcltige JSON-Syntax',
    'instances.emptyTitle': 'Keine Instanzen bereitgestellt',
    'instances.emptyDescription':
      'Katalogelement-Instanzen repr\u00e4sentieren bereitgestellte Dienste.',
    'instances.createButton': 'Erstellen',
    'instances.entityLabel': 'Katalogelement-Instanzen',
    'instances.createDialogTitle': 'Katalogelement-Instanz erstellen',
    'instances.rehydrateSuccess':
      'Katalogelement-Instanz erfolgreich rehydriert.',
    'instances.deleteLabel': 'Instanz',
    'instances.rehydrateTooltip': 'Rehydrieren',
    'instances.rehydrateAriaLabel': 'Instanz rehydrieren',
    'instances.deleteTooltip': 'L\u00f6schen',
    'instances.deleteAriaLabel': 'Instanz l\u00f6schen',
    'instances.rehydrateDialogTitle': 'Instanz rehydrieren?',
    'instances.rehydrateDialogBody':
      'Das Rehydrieren von {{instanceName}} stellt die Ressource neu bereit und weist m\u00f6glicherweise eine neue Ressourcen-ID zu. Diese Aktion kann nicht r\u00fcckg\u00e4ngig gemacht werden.',
    'instances.rehydrateDialogFallbackName': 'diese Instanz',
    'instances.rehydrateDialogCancel': 'Abbrechen',
    'instances.rehydrateDialogConfirm': 'Rehydrieren',
    'instances.columns.displayName': 'Anzeigename',
    'instances.columns.catalogItem': 'Katalogelement',
    'instances.columns.resourceId': 'Ressourcen-ID',
    'instances.columns.apiVersion': 'API-Version',
    'instances.columns.created': 'Erstellt',
    'instances.form.displayNameLabel': 'Anzeigename *',
    'instances.form.displayNameHelper':
      'Lesbarer Name f\u00fcr diese bereitgestellte Instanz (max. 63 Zeichen)',
    'instances.form.catalogItemLabel': 'Katalogelement *',
    'instances.form.catalogItemSelect': 'Katalogelement ausw\u00e4hlen\u2026',
    'instances.form.catalogItemHelperNoItems':
      'Keine Katalogelemente verf\u00fcgbar \u2014 erstellen Sie eines im Reiter Katalogelemente',
    'instances.form.catalogItemHelperDefault':
      'Das Katalogelement ausw\u00e4hlen, von dem eine Instanz bereitgestellt werden soll',
    'instances.form.apiVersionLabel': 'API-Version *',
    'instances.form.apiVersionHelper':
      'Muss dem Muster v<Zahl>[alpha|beta][Zahl] folgen \u2014 z.\u00a0B. v1, v1alpha1',
    'instances.form.fieldValuesSection': 'Feldwerte',
    'instances.form.fieldValuesSectionHint':
      '(bearbeitbare Felder dieses Katalogelements)',
    'instances.form.noEditableFields':
      'Dieses Katalogelement hat keine bearbeitbaren Felder.',
    'resources.emptyTitle': 'Keine Ressourcen gefunden',
    'resources.emptyDescription':
      'Durch DCM bereitgestellte Diensttyp-Instanzen werden hier angezeigt.',
    'resources.cardTitle': 'Ressourcen ({{count}})',
    'resources.columns.id': 'ID',
    'resources.columns.serviceType': 'Diensttyp',
    'resources.columns.provider': 'Anbieter',
    'resources.columns.status': 'Status',
    'resources.columns.created': 'Erstellt',
    'copyButton.copy': 'Kopieren',
    'copyButton.copied': 'Kopiert!',
    'copyButton.failed': 'Kopieren fehlgeschlagen',
    'copyButton.ariaLabel': 'In die Zwischenablage kopieren',
    'validation.provider.nameRequired': 'Name ist erforderlich',
    'validation.provider.namePattern':
      'Nur Kleinbuchstaben, Zahlen und Bindestriche sind erlaubt (muss mit einem Buchstaben beginnen)',
    'validation.provider.endpointRequired': 'Endpunkt ist erforderlich',
    'validation.provider.endpointPattern':
      'Muss mit http:// oder https:// beginnen (z. B. https://mein-dienst:8081/api)',
    'validation.provider.serviceTypeRequired': 'Diensttyp ist erforderlich',
    'validation.provider.serviceTypeMin':
      'Bitte wählen Sie einen Diensttyp aus der Liste',
    'validation.provider.schemaVersionRequired':
      'Schema-Version ist erforderlich',
    'validation.provider.schemaVersionPattern':
      'Muss dem Muster v<Zahl>[alpha|beta][Zahl] folgen \u2014 z. B. v1, v1alpha1, v2beta2',
    'validation.policy.displayNameRequired': 'Anzeigename ist erforderlich',
    'validation.policy.displayNameEmpty': 'Anzeigename darf nicht leer sein',
    'validation.policy.displayNameMax':
      'Anzeigename darf maximal 255 Zeichen lang sein',
    'validation.policy.descriptionMax':
      'Beschreibung darf maximal 255 Zeichen lang sein',
    'validation.policy.policyTypeRequired': 'Richtlinientyp ist erforderlich',
    'validation.policy.policyTypeOneOf': 'Muss GLOBAL oder USER sein',
    'validation.policy.priorityType': 'Priorität muss eine Zahl sein',
    'validation.policy.priorityRequired': 'Priorität ist erforderlich',
    'validation.policy.priorityInteger': 'Priorität muss eine ganze Zahl sein',
    'validation.policy.priorityMin': 'Priorität muss mindestens 1 sein',
    'validation.policy.priorityMax': 'Priorität darf höchstens 1000 sein',
    'validation.policy.regoCodeRequired': 'Rego-Code ist erforderlich',
    'validation.policy.regoCodeEmpty': 'Rego-Code darf nicht leer sein',
    'validation.policy.regoCodePackage':
      'Muss eine Paketdeklaration enthalten \u2014 z. B. "package dcm.placement"',
    'validation.catalogItem.displayNameRequired':
      'Anzeigename ist erforderlich',
    'validation.catalogItem.displayNameEmpty':
      'Anzeigename darf nicht leer sein',
    'validation.catalogItem.displayNameMax':
      'Anzeigename darf maximal 63 Zeichen lang sein',
    'validation.catalogItem.apiVersionRequired': 'API-Version ist erforderlich',
    'validation.catalogItem.apiVersionPattern':
      'Muss dem Muster v<Zahl>[alpha|beta][Zahl] folgen \u2014 z. B. v1, v1alpha1',
    'validation.catalogItem.serviceTypeRequired': 'Diensttyp ist erforderlich',
    'validation.catalogItem.duplicatePath':
      'Doppelter Pfad \u2014 Pfade müssen eindeutig sein',
    'validation.catalogItem.invalidJson':
      'Ungültiges JSON \u2014 Syntax korrigieren oder einfachen Zeichenkettenwert verwenden',
    'validation.catalogItem.schemaMustBeObject':
      'Muss ein JSON-Objekt sein \u2014 z. B. {"type":"integer"}',
    'validation.catalogItem.schemaMinMaxConflict':
      'Minimum ({{min}}) darf das Maximum ({{max}}) nicht überschreiten',
    'validation.catalogItem.defaultBelowMin':
      'Standardwert ({{value}}) liegt unter dem Schema-Minimum ({{min}})',
    'validation.catalogItem.defaultAboveMax':
      'Standardwert ({{value}}) überschreitet das Schema-Maximum ({{max}})',
    'validation.catalogItem.schemaInvalidJson': 'Ungültige JSON-Syntax',
    'validation.instance.displayNameRequired': 'Anzeigename ist erforderlich',
    'validation.instance.displayNameEmpty': 'Anzeigename darf nicht leer sein',
    'validation.instance.displayNameMax':
      'Anzeigename darf maximal 63 Zeichen lang sein',
    'validation.instance.catalogItemRequired':
      'Katalogelement ist erforderlich',
    'validation.instance.apiVersionRequired': 'API-Version ist erforderlich',
    'validation.instance.apiVersionPattern':
      'Muss dem Muster v<Zahl>[alpha|beta][Zahl] folgen \u2014 z. B. v1, v1alpha1',
    'validation.instance.fieldRequired': 'Dieses Feld ist erforderlich',
    'validation.instance.fieldMustBeNumber': 'Muss eine gültige Zahl sein',
    'validation.instance.fieldMin': 'Muss mindestens {{min}} sein',
    'validation.instance.fieldMax': 'Darf höchstens {{max}} sein',
  },
});

export default dcmTranslationDe;
