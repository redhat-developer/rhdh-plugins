"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.isWorkflowsSpecification1Element = exports.isWorkflowsSpecElement = exports.isWorkflowsElement = exports.isWorkflowStepsElement = exports.isWorkflowOutputsElement = exports.isWorkflowElement = exports.isSuccessActionElement = exports.isSuccessActionCriteriaElement = exports.isStepSuccessCriteriaElement = exports.isStepParametersElement = exports.isStepOutputsElement = exports.isStepOnSuccessElement = exports.isStepOnFailureElement = exports.isStepElement = exports.isStepDependsOnElement = exports.isSourceDescriptionsElement = exports.isSourceDescriptionElement = exports.isReferenceElement = exports.isParameterElement = exports.isJSONSchemaElement = exports.isInfoElement = exports.isFailureActionElement = exports.isFailureActionCriteriaElement = exports.isCriterionElement = exports.isComponentsElement = void 0;
var _apidomCore = require("@swagger-api/apidom-core");
var _WorkflowsSpecification = _interopRequireDefault(require("./elements/WorkflowsSpecification1.cjs"));
var _WorkflowsSpec = _interopRequireDefault(require("./elements/WorkflowsSpec.cjs"));
var _Info = _interopRequireDefault(require("./elements/Info.cjs"));
var _SourceDescription = _interopRequireDefault(require("./elements/SourceDescription.cjs"));
var _Workflow = _interopRequireDefault(require("./elements/Workflow.cjs"));
var _Step = _interopRequireDefault(require("./elements/Step.cjs"));
var _Parameter = _interopRequireDefault(require("./elements/Parameter.cjs"));
var _SuccessAction = _interopRequireDefault(require("./elements/SuccessAction.cjs"));
var _FailureAction = _interopRequireDefault(require("./elements/FailureAction.cjs"));
var _Components = _interopRequireDefault(require("./elements/Components.cjs"));
var _Criterion = _interopRequireDefault(require("./elements/Criterion.cjs"));
var _Reference = _interopRequireDefault(require("./elements/Reference.cjs"));
var _JSONSchema = _interopRequireDefault(require("./elements/JSONSchema.cjs"));
var _Workflows = _interopRequireDefault(require("./elements/nces/Workflows.cjs"));
var _SourceDescriptions = _interopRequireDefault(require("./elements/nces/SourceDescriptions.cjs"));
var _WorkflowSteps = _interopRequireDefault(require("./elements/nces/WorkflowSteps.cjs"));
var _WorkflowOutputs = _interopRequireDefault(require("./elements/nces/WorkflowOutputs.cjs"));
var _StepParameters = _interopRequireDefault(require("./elements/nces/StepParameters.cjs"));
var _StepDependsOn = _interopRequireDefault(require("./elements/nces/StepDependsOn.cjs"));
var _StepSuccessCriteria = _interopRequireDefault(require("./elements/nces/StepSuccessCriteria.cjs"));
var _StepOnSuccess = _interopRequireDefault(require("./elements/nces/StepOnSuccess.cjs"));
var _StepOnFailure = _interopRequireDefault(require("./elements/nces/StepOnFailure.cjs"));
var _StepOutputs = _interopRequireDefault(require("./elements/nces/StepOutputs.cjs"));
var _SuccessActionCriteria = _interopRequireDefault(require("./elements/nces/SuccessActionCriteria.cjs"));
var _FailureActionCriteria = _interopRequireDefault(require("./elements/nces/FailureActionCriteria.cjs"));
// NCE types

const isWorkflowsSpecElement = exports.isWorkflowsSpecElement = (0, _apidomCore.createPredicate)(({
  hasBasicElementProps,
  isElementType,
  primitiveEq
}) => {
  return element => element instanceof _WorkflowsSpec.default || hasBasicElementProps(element) && isElementType('workflowsSpec', element) && primitiveEq('string', element);
});
const isWorkflowsSpecification1Element = exports.isWorkflowsSpecification1Element = (0, _apidomCore.createPredicate)(({
  hasBasicElementProps,
  isElementType,
  primitiveEq,
  hasClass
}) => {
  return element => element instanceof _WorkflowsSpecification.default || hasBasicElementProps(element) && isElementType('workflowsSpecification1', element) && primitiveEq('object', element) && hasClass('api', element) && hasClass('workflow', element);
});
const isInfoElement = exports.isInfoElement = (0, _apidomCore.createPredicate)(({
  hasBasicElementProps,
  isElementType,
  primitiveEq,
  hasClass
}) => {
  return element => element instanceof _Info.default || hasBasicElementProps(element) && isElementType('info', element) && primitiveEq('object', element) && hasClass('info', element);
});
const isSourceDescriptionElement = exports.isSourceDescriptionElement = (0, _apidomCore.createPredicate)(({
  hasBasicElementProps,
  isElementType,
  primitiveEq
}) => {
  return element => element instanceof _SourceDescription.default || hasBasicElementProps(element) && isElementType('sourceDescription', element) && primitiveEq('object', element);
});
const isSourceDescriptionsElement = exports.isSourceDescriptionsElement = (0, _apidomCore.createPredicate)(({
  hasBasicElementProps,
  isElementType,
  primitiveEq,
  hasClass
}) => {
  return element => element instanceof _SourceDescriptions.default || hasBasicElementProps(element) && isElementType('sourceDescriptions', element) && primitiveEq('array', element) && hasClass('sourceDescriptions', element);
});
const isWorkflowsElement = exports.isWorkflowsElement = (0, _apidomCore.createPredicate)(({
  hasBasicElementProps,
  isElementType,
  primitiveEq,
  hasClass
}) => {
  return element => element instanceof _Workflows.default || hasBasicElementProps(element) && isElementType('workflows', element) && primitiveEq('array', element) && hasClass('workflows', element);
});
const isWorkflowStepsElement = exports.isWorkflowStepsElement = (0, _apidomCore.createPredicate)(({
  hasBasicElementProps,
  isElementType,
  primitiveEq,
  hasClass
}) => {
  return element => element instanceof _WorkflowSteps.default || hasBasicElementProps(element) && isElementType('array', element) && primitiveEq('array', element) && hasClass('workflow-steps', element);
});
const isWorkflowOutputsElement = exports.isWorkflowOutputsElement = (0, _apidomCore.createPredicate)(({
  hasBasicElementProps,
  isElementType,
  primitiveEq,
  hasClass
}) => {
  return element => element instanceof _WorkflowOutputs.default || hasBasicElementProps(element) && isElementType('array', element) && primitiveEq('array', element) && hasClass('workflow-outputs', element);
});
const isWorkflowElement = exports.isWorkflowElement = (0, _apidomCore.createPredicate)(({
  hasBasicElementProps,
  isElementType,
  primitiveEq
}) => {
  return element => element instanceof _Workflow.default || hasBasicElementProps(element) && isElementType('workflow', element) && primitiveEq('object', element);
});
const isStepOnSuccessElement = exports.isStepOnSuccessElement = (0, _apidomCore.createPredicate)(({
  hasBasicElementProps,
  isElementType,
  primitiveEq,
  hasClass
}) => {
  return element => element instanceof _StepOnSuccess.default || hasBasicElementProps(element) && isElementType('array', element) && primitiveEq('array', element) && hasClass('step-on-success', element);
});
const isStepOnFailureElement = exports.isStepOnFailureElement = (0, _apidomCore.createPredicate)(({
  hasBasicElementProps,
  isElementType,
  primitiveEq,
  hasClass
}) => {
  return element => element instanceof _StepOnFailure.default || hasBasicElementProps(element) && isElementType('array', element) && primitiveEq('array', element) && hasClass('step-on-failure', element);
});
const isStepOutputsElement = exports.isStepOutputsElement = (0, _apidomCore.createPredicate)(({
  hasBasicElementProps,
  isElementType,
  primitiveEq,
  hasClass
}) => {
  return element => element instanceof _StepOutputs.default || hasBasicElementProps(element) && isElementType('array', element) && primitiveEq('array', element) && hasClass('step-outputs', element);
});
const isStepElement = exports.isStepElement = (0, _apidomCore.createPredicate)(({
  hasBasicElementProps,
  isElementType,
  primitiveEq
}) => {
  return element => element instanceof _Step.default || hasBasicElementProps(element) && isElementType('step', element) && primitiveEq('object', element);
});
const isStepParametersElement = exports.isStepParametersElement = (0, _apidomCore.createPredicate)(({
  hasBasicElementProps,
  isElementType,
  primitiveEq,
  hasClass
}) => {
  return element => element instanceof _StepParameters.default || hasBasicElementProps(element) && isElementType('array', element) && primitiveEq('array', element) && hasClass('step-parameters', element);
});
const isStepDependsOnElement = exports.isStepDependsOnElement = (0, _apidomCore.createPredicate)(({
  hasBasicElementProps,
  isElementType,
  primitiveEq,
  hasClass
}) => {
  return element => element instanceof _StepDependsOn.default || hasBasicElementProps(element) && isElementType('array', element) && primitiveEq('array', element) && hasClass('step-depends-on', element);
});
const isStepSuccessCriteriaElement = exports.isStepSuccessCriteriaElement = (0, _apidomCore.createPredicate)(({
  hasBasicElementProps,
  isElementType,
  primitiveEq,
  hasClass
}) => {
  return element => element instanceof _StepSuccessCriteria.default || hasBasicElementProps(element) && isElementType('array', element) && primitiveEq('array', element) && hasClass('step-success-criteria', element) && hasClass('criteria', element);
});
const isParameterElement = exports.isParameterElement = (0, _apidomCore.createPredicate)(({
  hasBasicElementProps,
  isElementType,
  primitiveEq
}) => {
  return element => element instanceof _Parameter.default || hasBasicElementProps(element) && isElementType('parameter', element) && primitiveEq('object', element);
});
const isSuccessActionElement = exports.isSuccessActionElement = (0, _apidomCore.createPredicate)(({
  hasBasicElementProps,
  isElementType,
  primitiveEq
}) => {
  return element => element instanceof _SuccessAction.default || hasBasicElementProps(element) && isElementType('successAction', element) && primitiveEq('object', element);
});
const isComponentsElement = exports.isComponentsElement = (0, _apidomCore.createPredicate)(({
  hasBasicElementProps,
  isElementType,
  primitiveEq
}) => {
  return element => element instanceof _Components.default || hasBasicElementProps(element) && isElementType('components', element) && primitiveEq('object', element);
});
const isCriterionElement = exports.isCriterionElement = (0, _apidomCore.createPredicate)(({
  hasBasicElementProps,
  isElementType,
  primitiveEq
}) => {
  return element => element instanceof _Criterion.default || hasBasicElementProps(element) && isElementType('criterion', element) && primitiveEq('object', element);
});
const isReferenceElement = exports.isReferenceElement = (0, _apidomCore.createPredicate)(({
  hasBasicElementProps,
  isElementType,
  primitiveEq
}) => {
  return element => element instanceof _Reference.default || hasBasicElementProps(element) && isElementType('reference', element) && primitiveEq('object', element);
});
const isSuccessActionCriteriaElement = exports.isSuccessActionCriteriaElement = (0, _apidomCore.createPredicate)(({
  hasBasicElementProps,
  isElementType,
  primitiveEq,
  hasClass
}) => {
  return element => element instanceof _SuccessActionCriteria.default || hasBasicElementProps(element) && isElementType('array', element) && primitiveEq('array', element) && hasClass('success-action-criteria', element) && hasClass('criteria', element);
});
const isFailureActionElement = exports.isFailureActionElement = (0, _apidomCore.createPredicate)(({
  hasBasicElementProps,
  isElementType,
  primitiveEq
}) => {
  return element => element instanceof _FailureAction.default || hasBasicElementProps(element) && isElementType('failureAction', element) && primitiveEq('object', element);
});
const isFailureActionCriteriaElement = exports.isFailureActionCriteriaElement = (0, _apidomCore.createPredicate)(({
  hasBasicElementProps,
  isElementType,
  primitiveEq,
  hasClass
}) => {
  return element => element instanceof _FailureActionCriteria.default || hasBasicElementProps(element) && isElementType('array', element) && primitiveEq('array', element) && hasClass('failure-action-criteria', element) && hasClass('criteria', element);
});
const isJSONSchemaElement = exports.isJSONSchemaElement = (0, _apidomCore.createPredicate)(({
  hasBasicElementProps,
  isElementType,
  primitiveEq
}) => {
  return element => element instanceof _JSONSchema.default || hasBasicElementProps(element) && isElementType('jSONSchemaDraft202012', element) && primitiveEq('object', element);
});