'use strict';

const isJsonObjectSchema = (schema) => typeof schema === "object" && !!schema.properties && Object.values(schema.properties).filter(
  (curSchema) => typeof curSchema !== "object"
).length === 0;
const isComposedSchema = (schema) => !!schema.properties && Object.values(schema.properties).filter(
  (curSchema) => !isJsonObjectSchema(curSchema)
).length === 0;

exports.isComposedSchema = isComposedSchema;
exports.isJsonObjectSchema = isJsonObjectSchema;
//# sourceMappingURL=types.cjs.js.map
