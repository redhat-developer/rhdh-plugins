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

const dcmTranslationEs: TranslationMessages<
  'plugin.dcm',
  Record<string, string>
> = createTranslationMessages({
  ref: dcmTranslationRef,
  messages: {
    'page.title': 'Centro de datos',
    'page.tabs.providers': 'Proveedores',
    'page.tabs.policies': 'Pol\u00edticas',
    'page.tabs.serviceTypes': 'Tipos de servicio',
    'page.tabs.catalogItems': 'Elementos del cat\u00e1logo',
    'page.tabs.instances': 'Instancias',
    'page.tabs.resources': 'Recursos',
    'common.retry': 'Reintentar',
    'common.refresh': 'Actualizar',
    'common.search': 'Buscar',
    'common.clearSearch': 'Limpiar b\u00fasqueda',
    'common.edit': 'Editar',
    'common.delete': 'Eliminar',
    'common.actions': 'Acciones',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.saving': 'Guardando\u2026',
    'common.close': 'Cerrar',
    'common.rows': 'filas',
    'deleteDialog.title': 'Eliminar {{resourceLabel}}',
    'deleteDialog.confirmButton': 'Eliminar',
    'deleteDialog.cancelButton': 'Cancelar',
    'deleteDialog.body':
      '\u00bfEst\u00e1 seguro de que desea eliminar {{resourceName}}? Esta acci\u00f3n no se puede deshacer.',
    'providers.emptyTitle': 'No hay proveedores registrados',
    'providers.emptyDescription':
      'Registre un proveedor de servicios para que DCM pueda aprovisionar recursos en infraestructura externa (p.\u00a0ej. OpenShift, AWS).',
    'providers.registerButton': 'Registrar',
    'providers.entityLabel': 'Proveedores',
    'providers.registerDialogTitle': 'Registrar proveedor',
    'providers.editDialogTitle': 'Editar proveedor',
    'providers.saveButton': 'Guardar',
    'providers.createSuccess': 'Proveedor registrado correctamente.',
    'providers.updateSuccess': 'Proveedor actualizado correctamente.',
    'providers.deleteSuccess': 'Proveedor eliminado correctamente.',
    'providers.deleteLabel': 'proveedor',
    'providers.columns.displayName': 'Nombre visible',
    'providers.columns.name': 'Nombre',
    'providers.columns.endpoint': 'Punto de conexi\u00f3n',
    'providers.columns.serviceType': 'Tipo de servicio',
    'providers.columns.operations': 'Operaciones',
    'providers.columns.status': 'Estado',
    'providers.form.nameLabel': 'Nombre *',
    'providers.form.namePlaceholder': 'p.\u00a0ej. mi-proveedor-k8s',
    'providers.form.nameHelper':
      'Identificador \u00fanico \u2014 solo letras min\u00fasculas, n\u00fameros y guiones',
    'providers.form.nameHelperEditMode':
      'El nombre del proveedor no puede cambiarse tras su creaci\u00f3n',
    'providers.form.endpointLabel': 'Punto de conexi\u00f3n *',
    'providers.form.endpointPlaceholder': 'https://api.ejemplo.com',
    'providers.form.endpointHelper':
      'URL completa de la API del proveedor (p.\u00a0ej. https://api.ejemplo.com)',
    'providers.form.serviceTypeLabel': 'Tipo de servicio *',
    'providers.form.serviceTypeEmpty': 'No hay tipos de servicio disponibles',
    'providers.form.serviceTypeSelect': 'Seleccione un tipo de servicio\u2026',
    'providers.form.serviceTypeHelperNoTypes':
      'Cree primero un tipo de servicio en la pesta\u00f1a Tipos de servicio',
    'providers.form.serviceTypeHelperDefault':
      'Seleccionar de los tipos de servicio registrados',
    'providers.form.schemaVersionLabel': 'Versi\u00f3n de esquema *',
    'providers.form.schemaVersionHelper':
      'p.\u00a0ej. v1, v1alpha1, v2beta2 \u2014 solo v<n\u00famero>[alpha|beta][n\u00famero]',
    'providers.form.operationsLabel': 'Operaciones',
    'providers.form.operationsHelper':
      'Seleccionar las operaciones admitidas por este proveedor',
    'policies.emptyTitle': 'No hay pol\u00edticas definidas',
    'policies.emptyDescription':
      'Cree pol\u00edticas OPA Rego para aplicar reglas de gobernanza en los recursos DCM.',
    'policies.createButton': 'Crear',
    'policies.entityLabel': 'Pol\u00edticas',
    'policies.createDialogTitle': 'Crear pol\u00edtica',
    'policies.editDialogTitle': 'Editar pol\u00edtica',
    'policies.saveButton': 'Guardar',
    'policies.createSuccess': 'Pol\u00edtica creada correctamente.',
    'policies.updateSuccess': 'Pol\u00edtica actualizada correctamente.',
    'policies.deleteSuccess': 'Pol\u00edtica eliminada correctamente.',
    'policies.deleteLabel': 'pol\u00edtica',
    'policies.enabledYes': 'S\u00ed',
    'policies.enabledNo': 'No',
    'policies.toggleDisable': 'Deshabilitar pol\u00edtica',
    'policies.toggleEnable': 'Habilitar pol\u00edtica',
    'policies.toggleDisableAria': 'Deshabilitar',
    'policies.toggleEnableAria': 'Habilitar',
    'policies.columns.displayName': 'Nombre visible',
    'policies.columns.type': 'Tipo',
    'policies.columns.priority': 'Prioridad',
    'policies.columns.enabled': 'Habilitada',
    'policies.columns.description': 'Descripci\u00f3n',
    'policies.form.displayNameLabel': 'Nombre visible *',
    'policies.form.displayNameHelper': 'Nombre legible para esta pol\u00edtica',
    'policies.form.descriptionLabel': 'Descripci\u00f3n',
    'policies.form.descriptionHelper':
      'Opcional \u2014 describa el prop\u00f3sito de esta pol\u00edtica',
    'policies.form.policyTypeLabel': 'Tipo de pol\u00edtica *',
    'policies.form.policyTypeGlobal':
      'GLOBAL \u2014 se aplica a todas las solicitudes',
    'policies.form.policyTypeUser': 'USER \u2014 se aplica por usuario',
    'policies.form.priorityLabel': 'Prioridad *',
    'policies.form.priorityHelper':
      '1 (m\u00e1s alta) \u2013 1000 (m\u00e1s baja), predeterminado 500',
    'policies.form.regoCodeLabel': 'C\u00f3digo Rego *',
    'policies.form.regoCodeHelper':
      'Pol\u00edtica OPA Rego evaluada por el Gestor de Ubicaci\u00f3n.',
    'policies.form.regoCodePlaceholder': 'package dcm.placement',
    'policies.form.enabledLabel': 'Habilitada',
    'serviceTypes.emptyTitle': 'No hay tipos de servicio definidos',
    'serviceTypes.emptyDescription':
      'Los tipos de servicio definen el esquema de plantilla para los elementos del cat\u00e1logo.',
    'serviceTypes.cardTitle': 'Tipos de servicio ({{count}})',
    'serviceTypes.columns.serviceType': 'Tipo de servicio',
    'serviceTypes.columns.apiVersion': 'Versi\u00f3n de API',
    'serviceTypes.columns.path': 'Ruta',
    'serviceTypes.columns.created': 'Creado',
    'catalogItems.emptyTitle': 'No hay elementos del cat\u00e1logo definidos',
    'catalogItems.emptyDescription':
      'Los elementos del cat\u00e1logo son plantillas de servicio que los desarrolladores pueden aprovisionar.',
    'catalogItems.createButton': 'Crear',
    'catalogItems.entityLabel': 'Elementos del cat\u00e1logo',
    'catalogItems.createDrawerTitle': 'Crear elemento del cat\u00e1logo',
    'catalogItems.editDrawerTitle': 'Editar elemento del cat\u00e1logo',
    'catalogItems.saveButton': 'Guardar',
    'catalogItems.createSuccess':
      'Elemento del cat\u00e1logo creado correctamente.',
    'catalogItems.updateSuccess':
      'Elemento del cat\u00e1logo actualizado correctamente.',
    'catalogItems.deleteSuccess':
      'Elemento del cat\u00e1logo eliminado correctamente.',
    'catalogItems.deleteLabel': 'elemento del cat\u00e1logo',
    'catalogItems.columns.displayName': 'Nombre visible',
    'catalogItems.columns.apiVersion': 'Versi\u00f3n de API',
    'catalogItems.columns.serviceType': 'Tipo de servicio',
    'catalogItems.columns.fields': 'Campos',
    'catalogItems.columns.created': 'Creado',
    'catalogItems.fieldCount_one': '1 campo',
    'catalogItems.fieldCount_other': '{{count}} campos',
    'catalogItems.form.importButton': 'Importar desde archivo',
    'catalogItems.form.importTooltip':
      'Rellenar el formulario desde una definici\u00f3n JSON o YAML',
    'catalogItems.form.importError':
      'Error al importar el archivo \u2014 compruebe que sea JSON o YAML v\u00e1lido.',
    'catalogItems.form.displayNameLabel': 'Nombre visible *',
    'catalogItems.form.displayNameHelper':
      'Nombre legible para este elemento del cat\u00e1logo (m\u00e1x. 63 caracteres)',
    'catalogItems.form.apiVersionLabel': 'Versi\u00f3n de API *',
    'catalogItems.form.apiVersionHelper':
      'Debe seguir el patr\u00f3n v<n\u00famero>[alpha|beta][n\u00famero] \u2014 p.\u00a0ej. v1, v1alpha1',
    'catalogItems.form.serviceTypeLabel': 'Tipo de servicio *',
    'catalogItems.form.serviceTypeHelperEdit':
      'El tipo de servicio no puede cambiarse tras su creaci\u00f3n',
    'catalogItems.form.serviceTypeHelperNoTypes':
      'No hay tipos de servicio disponibles \u2014 cree uno en la pesta\u00f1a Tipos de servicio',
    'catalogItems.form.serviceTypeHelperDefault':
      'Seleccione el tipo de servicio en el que se basa este elemento',
    'catalogItems.form.fieldsLabel': 'Campos *',
    'catalogItems.form.fieldsCaption': '(se requiere al menos uno)',
    'catalogItems.form.fieldsErrorEmpty':
      'A\u00f1ada al menos un campo con una ruta no vac\u00eda.',
    'catalogItems.form.fieldAddButton': 'A\u00f1adir campo',
    'catalogItems.form.fieldAddTooltip':
      'Complete la ruta del \u00faltimo campo antes de a\u00f1adir uno nuevo',
    'catalogItems.form.fieldPathLabel': 'Ruta *',
    'catalogItems.form.fieldPathHelper': 'p.\u00a0ej. config.replicas',
    'catalogItems.form.fieldDisplayNameLabel': 'Nombre visible',
    'catalogItems.form.fieldEditableLabel': 'Editable',
    'catalogItems.form.fieldDefaultValueLabel': 'Valor predeterminado',
    'catalogItems.form.fieldDefaultValueHelper':
      'Cualquier valor JSON \u2014 p.\u00a0ej. 42, "hola", true, [1,2]',
    'catalogItems.form.fieldRemoveAriaLabel': 'Eliminar campo',
    'catalogItems.form.schemaLabel': 'Esquema de validaci\u00f3n',
    'catalogItems.form.schemaEditButton': 'Editar JSON',
    'catalogItems.form.schemaAddButton': 'A\u00f1adir JSON',
    'catalogItems.form.schemaDialogTitle': 'Esquema de validaci\u00f3n',
    'catalogItems.form.schemaDialogHelper':
      'Objeto JSON Schema \u2014 p.\u00a0ej. {"type":"integer","minimum":0}',
    'catalogItems.form.schemaDialogCancel': 'Cancelar',
    'catalogItems.form.schemaDialogApply': 'Aplicar',
    'catalogItems.form.schemaMustBeObject':
      'Debe ser un objeto JSON, no un array ni un primitivo',
    'catalogItems.form.schemaInvalidJson': 'Sintaxis JSON no v\u00e1lida',
    'instances.emptyTitle': 'No hay instancias aprovisionadas',
    'instances.emptyDescription':
      'Las instancias de elementos del cat\u00e1logo representan servicios aprovisionados.',
    'instances.createButton': 'Crear',
    'instances.entityLabel': 'Instancias de elementos del cat\u00e1logo',
    'instances.createDialogTitle':
      'Crear instancia de elemento del cat\u00e1logo',
    'instances.rehydrateSuccess':
      'Instancia de elemento del cat\u00e1logo rehidratada correctamente.',
    'instances.deleteLabel': 'instancia',
    'instances.rehydrateTooltip': 'Rehidratar',
    'instances.rehydrateAriaLabel': 'Rehidratar instancia',
    'instances.deleteTooltip': 'Eliminar',
    'instances.deleteAriaLabel': 'Eliminar instancia',
    'instances.rehydrateDialogTitle': '\u00bfRehidratar instancia?',
    'instances.rehydrateDialogBody':
      'Rehidratar {{instanceName}} volver\u00e1 a aprovisionar el recurso y puede asignar un nuevo ID. Esta acci\u00f3n no se puede deshacer.',
    'instances.rehydrateDialogFallbackName': 'esta instancia',
    'instances.rehydrateDialogCancel': 'Cancelar',
    'instances.rehydrateDialogConfirm': 'Rehidratar',
    'instances.columns.displayName': 'Nombre visible',
    'instances.columns.catalogItem': 'Elemento del cat\u00e1logo',
    'instances.columns.resourceId': 'ID de recurso',
    'instances.columns.apiVersion': 'Versi\u00f3n de API',
    'instances.columns.created': 'Creado',
    'instances.form.displayNameLabel': 'Nombre visible *',
    'instances.form.displayNameHelper':
      'Nombre legible para esta instancia aprovisionada (m\u00e1x. 63 caracteres)',
    'instances.form.catalogItemLabel': 'Elemento del cat\u00e1logo *',
    'instances.form.catalogItemSelect':
      'Seleccione un elemento del cat\u00e1logo\u2026',
    'instances.form.catalogItemHelperNoItems':
      'No hay elementos del cat\u00e1logo disponibles \u2014 cree uno en la pesta\u00f1a Elementos del cat\u00e1logo',
    'instances.form.catalogItemHelperDefault':
      'Elija el elemento del cat\u00e1logo del que aprovisionar una instancia',
    'instances.form.apiVersionLabel': 'Versi\u00f3n de API *',
    'instances.form.apiVersionHelper':
      'Debe seguir el patr\u00f3n v<n\u00famero>[alpha|beta][n\u00famero] \u2014 p.\u00a0ej. v1, v1alpha1',
    'instances.form.fieldValuesSection': 'Valores de campo',
    'instances.form.fieldValuesSectionHint':
      '(campos editables definidos por este elemento del cat\u00e1logo)',
    'instances.form.noEditableFields':
      'Este elemento del cat\u00e1logo no tiene campos editables.',
    'resources.emptyTitle': 'No se encontraron recursos',
    'resources.emptyDescription':
      'Las instancias de tipos de servicio aprovisionadas a trav\u00e9s de DCM aparecer\u00e1n aqu\u00ed.',
    'resources.cardTitle': 'Recursos ({{count}})',
    'resources.columns.id': 'ID',
    'resources.columns.serviceType': 'Tipo de servicio',
    'resources.columns.provider': 'Proveedor',
    'resources.columns.status': 'Estado',
    'resources.columns.created': 'Creado',
    'copyButton.copy': 'Copiar',
    'copyButton.copied': '\u00a1Copiado!',
    'copyButton.failed': 'Error al copiar',
    'copyButton.ariaLabel': 'Copiar al portapapeles',
    'validation.provider.nameRequired': 'El nombre es obligatorio',
    'validation.provider.namePattern':
      'Solo se permiten letras min\u00fasculas, n\u00fameros y guiones (debe comenzar con una letra)',
    'validation.provider.endpointRequired':
      'El punto de conexi\u00f3n es obligatorio',
    'validation.provider.endpointPattern':
      'Debe comenzar con http:// o https:// (p. ej. https://mi-servicio:8081/api)',
    'validation.provider.serviceTypeRequired':
      'El tipo de servicio es obligatorio',
    'validation.provider.serviceTypeMin':
      'Seleccione un tipo de servicio de la lista',
    'validation.provider.schemaVersionRequired':
      'La versi\u00f3n del esquema es obligatoria',
    'validation.provider.schemaVersionPattern':
      'Debe seguir el patr\u00f3n v<n\u00famero>[alpha|beta][n\u00famero] \u2014 p. ej. v1, v1alpha1, v2beta2',
    'validation.policy.displayNameRequired':
      'El nombre para mostrar es obligatorio',
    'validation.policy.displayNameEmpty':
      'El nombre para mostrar no puede estar vac\u00edo',
    'validation.policy.displayNameMax':
      'El nombre para mostrar debe tener como m\u00e1ximo 255 caracteres',
    'validation.policy.descriptionMax':
      'La descripci\u00f3n debe tener como m\u00e1ximo 255 caracteres',
    'validation.policy.policyTypeRequired':
      'El tipo de pol\u00edtica es obligatorio',
    'validation.policy.policyTypeOneOf': 'Debe ser GLOBAL o USER',
    'validation.policy.priorityType': 'La prioridad debe ser un n\u00famero',
    'validation.policy.priorityRequired': 'La prioridad es obligatoria',
    'validation.policy.priorityInteger':
      'La prioridad debe ser un n\u00famero entero',
    'validation.policy.priorityMin': 'La prioridad debe ser al menos 1',
    'validation.policy.priorityMax':
      'La prioridad debe ser como m\u00e1ximo 1000',
    'validation.policy.regoCodeRequired': 'El c\u00f3digo Rego es obligatorio',
    'validation.policy.regoCodeEmpty':
      'El c\u00f3digo Rego no puede estar vac\u00edo',
    'validation.policy.regoCodePackage':
      'Debe contener una declaraci\u00f3n de paquete \u2014 p. ej. "package dcm.placement"',
    'validation.catalogItem.displayNameRequired':
      'El nombre para mostrar es obligatorio',
    'validation.catalogItem.displayNameEmpty':
      'El nombre para mostrar no puede estar vac\u00edo',
    'validation.catalogItem.displayNameMax':
      'El nombre para mostrar debe tener como m\u00e1ximo 63 caracteres',
    'validation.catalogItem.apiVersionRequired':
      'La versi\u00f3n de API es obligatoria',
    'validation.catalogItem.apiVersionPattern':
      'Debe seguir el patr\u00f3n v<n\u00famero>[alpha|beta][n\u00famero] \u2014 p. ej. v1, v1alpha1',
    'validation.catalogItem.serviceTypeRequired':
      'El tipo de servicio es obligatorio',
    'validation.catalogItem.duplicatePath':
      'Ruta duplicada \u2014 las rutas deben ser \u00fanicas',
    'validation.catalogItem.invalidJson':
      'JSON no v\u00e1lido \u2014 corrija la sintaxis o use un valor de cadena simple',
    'validation.catalogItem.schemaMustBeObject':
      'Debe ser un objeto JSON \u2014 p. ej. {"type":"integer"}',
    'validation.catalogItem.schemaMinMaxConflict':
      'El m\u00ednimo ({{min}}) no debe superar el m\u00e1ximo ({{max}})',
    'validation.catalogItem.defaultBelowMin':
      'El valor predeterminado ({{value}}) est\u00e1 por debajo del m\u00ednimo del esquema ({{min}})',
    'validation.catalogItem.defaultAboveMax':
      'El valor predeterminado ({{value}}) supera el m\u00e1ximo del esquema ({{max}})',
    'validation.catalogItem.schemaInvalidJson': 'Sintaxis JSON no v\u00e1lida',
    'validation.instance.displayNameRequired':
      'El nombre para mostrar es obligatorio',
    'validation.instance.displayNameEmpty':
      'El nombre para mostrar no puede estar vac\u00edo',
    'validation.instance.displayNameMax':
      'El nombre para mostrar debe tener como m\u00e1ximo 63 caracteres',
    'validation.instance.catalogItemRequired':
      'El elemento de cat\u00e1logo es obligatorio',
    'validation.instance.apiVersionRequired':
      'La versi\u00f3n de API es obligatoria',
    'validation.instance.apiVersionPattern':
      'Debe seguir el patr\u00f3n v<n\u00famero>[alpha|beta][n\u00famero] \u2014 p. ej. v1, v1alpha1',
    'validation.instance.fieldRequired': 'Este campo es obligatorio',
    'validation.instance.fieldMustBeNumber':
      'Debe ser un n\u00famero v\u00e1lido',
    'validation.instance.fieldMin': 'Debe ser al menos {{min}}',
    'validation.instance.fieldMax': 'Debe ser como m\u00e1ximo {{max}}',
  },
});

export default dcmTranslationEs;
