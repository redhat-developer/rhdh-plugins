'use strict';

var sdkTypescript = require('@severlessworkflow/sdk-typescript');
var jsYaml = require('js-yaml');

function fromWorkflowSource(content) {
  const parsed = sdkTypescript.Specification.Workflow.fromSource(content);
  const workflow = parsed.sourceModel ?? parsed;
  return removeProperty(workflow, "normalize");
}
function toWorkflowString(definition, format) {
  switch (format) {
    case "json":
      return toWorkflowJson(definition);
    case "yaml":
      return toWorkflowYaml(definition);
    default:
      throw new Error(`Unsupported format ${format}`);
  }
}
function toWorkflowJson(definition) {
  return JSON.stringify(definition, null, 2);
}
function toWorkflowYaml(definition) {
  return jsYaml.dump(definition);
}
function extractWorkflowFormatFromUri(uri) {
  const match = RegExp(/\.sw\.(json|yaml|yml)$/).exec(uri);
  if (match) {
    if (match[1] === "yml" || match[1] === "yaml") {
      return "yaml";
    }
    if (match[1] === "json") {
      return "json";
    }
  }
  throw new Error(`Unsupported workflow format for uri ${uri}`);
}
function removeProperty(obj, propToDelete) {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => removeProperty(item, propToDelete));
  }
  const newObj = {};
  for (const key in obj) {
    if (key !== propToDelete) {
      newObj[key] = removeProperty(obj[key], propToDelete);
    }
  }
  return newObj;
}
function parseWorkflowVariables(variables) {
  if (variables === void 0) {
    return void 0;
  }
  if (typeof variables === "string") {
    try {
      return JSON.parse(variables);
    } catch {
      throw new Error(
        `Error when parsing process instance variables: ${variables}`
      );
    }
  }
  return variables;
}
function extractWorkflowFormat(source) {
  try {
    JSON.parse(source);
    return "json";
  } catch (_) {
    return "yaml";
  }
}

exports.extractWorkflowFormat = extractWorkflowFormat;
exports.extractWorkflowFormatFromUri = extractWorkflowFormatFromUri;
exports.fromWorkflowSource = fromWorkflowSource;
exports.parseWorkflowVariables = parseWorkflowVariables;
exports.toWorkflowJson = toWorkflowJson;
exports.toWorkflowString = toWorkflowString;
exports.toWorkflowYaml = toWorkflowYaml;
//# sourceMappingURL=workflow.cjs.js.map
