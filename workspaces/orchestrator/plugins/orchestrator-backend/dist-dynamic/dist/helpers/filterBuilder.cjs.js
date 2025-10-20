'use strict';

var backstagePluginOrchestratorCommon = require('@redhat/backstage-plugin-orchestrator-common');

const supportedOperators = [
  backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.Eq,
  backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.Like,
  backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.In,
  backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.IsNull,
  backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.Gt,
  backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.Gte,
  backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.Lt,
  backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.Lte,
  backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.Between
];
const supportedOperatorsByType = {
  [backstagePluginOrchestratorCommon.TypeName.String]: [
    backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.In,
    backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.Like,
    backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.IsNull,
    backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.Eq
  ],
  [backstagePluginOrchestratorCommon.TypeName.Id]: [
    backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.In,
    backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.IsNull,
    backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.Eq
  ],
  [backstagePluginOrchestratorCommon.TypeName.Date]: [
    backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.IsNull,
    backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.Eq,
    backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.Gt,
    backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.Gte,
    backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.Lt,
    backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.Lte,
    backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.Between
  ]
};
function isLogicalFilter(filter) {
  return filter.filters !== void 0;
}
function isNestedFilter(filter) {
  return filter.nested !== void 0;
}
function handleLogicalFilter(introspection, type, filter) {
  if (!filter.operator) return "";
  const subClauses = filter.filters.map(
    (f) => buildFilterCondition(introspection, type, f)
  );
  return `${filter.operator.toLowerCase()}: {${subClauses.join(", ")}}`;
}
function handleNestedFilter(introspection, type, filter) {
  const subClauses = buildFilterCondition(
    introspection,
    type,
    filter.nested,
    true
  );
  return `${filter.field}: {${subClauses}}`;
}
function handleBetweenOperator(filter) {
  if (!Array.isArray(filter.value) || filter.value.length !== 2) {
    throw new Error("Between operator requires an array of two elements");
  }
  return `${filter.field}: {${getGraphQLOperator(
    backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.Between
  )}: {from: "${filter.value[0]}", to: "${filter.value[1]}"}}`;
}
function handleIsNullOperator(filter) {
  return `${filter.field}: {${getGraphQLOperator(
    backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.IsNull
  )}: ${convertToBoolean(filter.value)}}`;
}
function isEnumFilter(fieldName, type) {
  if (type === "ProcessInstance") {
    if (fieldName === "state") {
      return true;
    }
  }
  return false;
}
function isValidEnumOperator(operator) {
  return operator === backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.In || operator === backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.Eq;
}
function handleBinaryOperator(binaryFilter, fieldDef, type) {
  if (isEnumFilter(binaryFilter.field, type)) {
    if (!isValidEnumOperator(binaryFilter.operator)) {
      throw new Error(
        `Invalid operator ${binaryFilter.operator} for enum field ${binaryFilter.field} filter`
      );
    }
  }
  const formattedValue = Array.isArray(binaryFilter.value) ? `[${binaryFilter.value.map((v) => formatValue(binaryFilter.field, v, fieldDef, type)).join(", ")}]` : formatValue(binaryFilter.field, binaryFilter.value, fieldDef, type);
  return `${binaryFilter.field}: {${getGraphQLOperator(
    binaryFilter.operator
  )}: ${formattedValue}}`;
}
function buildFilterCondition(introspection, type, filters, isNested) {
  if (!filters) {
    return "";
  }
  if (isNestedFilter(filters)) {
    return handleNestedFilter(introspection, type, filters);
  }
  if (isLogicalFilter(filters)) {
    return handleLogicalFilter(introspection, type, filters);
  }
  if (!isOperatorSupported(filters.operator)) {
    throw new Error(
      `Unsupported operator ${filters.operator}. Supported operators are: ${supportedOperators.join(", ")}`
    );
  }
  let fieldDef;
  if (!isNested) {
    fieldDef = introspection.find((f) => f.name === filters.field);
    if (!fieldDef) {
      throw new Error(`Can't find field "${filters.field}" definition`);
    }
    if (!isOperatorAllowedForField(filters.operator, fieldDef, type)) {
      const allowedOperators = supportedOperatorsByType[fieldDef.type.name] || [];
      throw new Error(
        `Unsupported operator ${filters.operator} for field "${fieldDef.name}" of type "${fieldDef.type.name}". Allowed operators are: ${allowedOperators.join(", ")}`
      );
    }
  }
  switch (filters.operator) {
    case backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.IsNull:
      return handleIsNullOperator(filters);
    case backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.Between:
      return handleBetweenOperator(filters);
    case backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.Eq:
    case backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.Like:
    case backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.In:
    case backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.Gt:
    case backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.Gte:
    case backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.Lt:
    case backstagePluginOrchestratorCommon.FieldFilterOperatorEnum.Lte:
      return handleBinaryOperator(filters, fieldDef, type);
    default:
      throw new Error(`Can't build filter condition`);
  }
}
function isOperatorSupported(operator) {
  return supportedOperators.includes(operator);
}
function isFieldFilterSupported(fieldDef) {
  return fieldDef?.type.name === backstagePluginOrchestratorCommon.TypeName.String;
}
function isOperatorAllowedForField(operator, fieldDef, type) {
  if (isEnumFilter(fieldDef.name, type) && isValidEnumOperator(operator)) {
    return true;
  }
  const allowedForType = supportedOperatorsByType[fieldDef.type.name];
  return allowedForType ? allowedForType.includes(operator) : false;
}
function convertToBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  if (typeof value === "number") {
    return value === 1;
  }
  return false;
}
function formatValue(fieldName, fieldValue, fieldDef, type) {
  if (!fieldDef) {
    return `"${fieldValue}"`;
  }
  if (!isFieldFilterSupported) {
    throw new Error(`Unsupported field type ${fieldDef.type.name}`);
  }
  if (isEnumFilter(fieldName, type)) {
    return `${fieldValue}`;
  }
  if (fieldDef.type.name === backstagePluginOrchestratorCommon.TypeName.String || fieldDef.type.name === backstagePluginOrchestratorCommon.TypeName.Id || fieldDef.type.name === backstagePluginOrchestratorCommon.TypeName.Date) {
    return `"${fieldValue}"`;
  }
  throw new Error(
    `Failed to format value for ${fieldName} ${fieldValue} with type ${fieldDef.type.name}`
  );
}
function getGraphQLOperator(operator) {
  switch (operator) {
    case "EQ":
      return "equal";
    case "LIKE":
      return "like";
    case "IN":
      return "in";
    case "IS_NULL":
      return "isNull";
    case "GT":
      return "greaterThan";
    case "GTE":
      return "greaterThanEqual";
    case "LT":
      return "lessThan";
    case "LTE":
      return "lessThanEqual";
    case "BETWEEN":
      return "between";
    default:
      throw new Error(`Operation "${operator}" not supported`);
  }
}

exports.buildFilterCondition = buildFilterCondition;
exports.isOperatorAllowedForField = isOperatorAllowedForField;
//# sourceMappingURL=filterBuilder.cjs.js.map
