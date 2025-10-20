"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RULE_NAME = void 0;
const utils_1 = require("@typescript-eslint/utils");
const create_testing_library_rule_1 = require("../create-testing-library-rule");
const node_utils_1 = require("../node-utils");
const utils_2 = require("../utils");
exports.RULE_NAME = 'await-async-events';
const FIRE_EVENT_NAME = 'fireEvent';
const USER_EVENT_NAME = 'userEvent';
const USER_EVENT_SETUP_FUNCTION_NAME = 'setup';
exports.default = (0, create_testing_library_rule_1.createTestingLibraryRule)({
    name: exports.RULE_NAME,
    meta: {
        type: 'problem',
        docs: {
            description: 'Enforce promises from async event methods are handled',
            recommendedConfig: {
                dom: ['error', { eventModule: 'userEvent' }],
                angular: ['error', { eventModule: 'userEvent' }],
                react: ['error', { eventModule: 'userEvent' }],
                vue: ['error', { eventModule: ['fireEvent', 'userEvent'] }],
                marko: ['error', { eventModule: ['fireEvent', 'userEvent'] }],
            },
        },
        messages: {
            awaitAsyncEvent: 'Promise returned from async event method `{{ name }}` must be handled',
            awaitAsyncEventWrapper: 'Promise returned from `{{ name }}` wrapper over async event method must be handled',
        },
        fixable: 'code',
        schema: [
            {
                type: 'object',
                default: {},
                additionalProperties: false,
                properties: {
                    eventModule: {
                        default: USER_EVENT_NAME,
                        oneOf: [
                            {
                                type: 'string',
                                enum: utils_2.EVENTS_SIMULATORS,
                            },
                            {
                                type: 'array',
                                items: {
                                    type: 'string',
                                    enum: utils_2.EVENTS_SIMULATORS,
                                },
                            },
                        ],
                    },
                },
            },
        ],
    },
    defaultOptions: [
        {
            eventModule: USER_EVENT_NAME,
        },
    ],
    create(context, [options], helpers) {
        const functionWrappersNames = [];
        function reportUnhandledNode({ node, closestCallExpression, messageId = 'awaitAsyncEvent', fix, }) {
            if (!(0, node_utils_1.isPromiseHandled)(node)) {
                context.report({
                    node: closestCallExpression.callee,
                    messageId,
                    data: { name: node.name },
                    fix,
                });
            }
        }
        function detectEventMethodWrapper(node) {
            const innerFunction = (0, node_utils_1.getInnermostReturningFunction)(context, node);
            if (innerFunction) {
                functionWrappersNames.push((0, node_utils_1.getFunctionName)(innerFunction));
            }
        }
        const eventModules = typeof options.eventModule === 'string'
            ? [options.eventModule]
            : options.eventModule;
        const isFireEventEnabled = eventModules.includes(FIRE_EVENT_NAME);
        const isUserEventEnabled = eventModules.includes(USER_EVENT_NAME);
        return {
            'CallExpression Identifier'(node) {
                if ((isFireEventEnabled && helpers.isFireEventMethod(node)) ||
                    (isUserEventEnabled && helpers.isUserEventMethod(node))) {
                    if (node.name === USER_EVENT_SETUP_FUNCTION_NAME) {
                        return;
                    }
                    detectEventMethodWrapper(node);
                    const closestCallExpression = (0, node_utils_1.findClosestCallExpressionNode)(node, true);
                    if (!(closestCallExpression === null || closestCallExpression === void 0 ? void 0 : closestCallExpression.parent)) {
                        return;
                    }
                    const references = (0, node_utils_1.getVariableReferences)(context, closestCallExpression.parent);
                    if (references.length === 0) {
                        reportUnhandledNode({
                            node,
                            closestCallExpression,
                            fix: (fixer) => {
                                if ((0, node_utils_1.isMemberExpression)(node.parent)) {
                                    const functionExpression = (0, node_utils_1.findClosestFunctionExpressionNode)(node);
                                    if (functionExpression) {
                                        const memberExpressionFixer = fixer.insertTextBefore(node.parent, 'await ');
                                        if (functionExpression.async) {
                                            return memberExpressionFixer;
                                        }
                                        else {
                                            functionExpression.async = true;
                                            return [
                                                memberExpressionFixer,
                                                fixer.insertTextBefore(functionExpression, 'async '),
                                            ];
                                        }
                                    }
                                }
                                return null;
                            },
                        });
                    }
                    else {
                        for (const reference of references) {
                            if (utils_1.ASTUtils.isIdentifier(reference.identifier)) {
                                reportUnhandledNode({
                                    node: reference.identifier,
                                    closestCallExpression,
                                });
                            }
                        }
                    }
                }
                else if (functionWrappersNames.includes(node.name)) {
                    const closestCallExpression = (0, node_utils_1.findClosestCallExpressionNode)(node, true);
                    if (!closestCallExpression) {
                        return;
                    }
                    reportUnhandledNode({
                        node,
                        closestCallExpression,
                        messageId: 'awaitAsyncEventWrapper',
                        fix: (fixer) => {
                            const functionExpression = (0, node_utils_1.findClosestFunctionExpressionNode)(node);
                            if (functionExpression) {
                                const nodeFixer = fixer.insertTextBefore(node, 'await ');
                                if (functionExpression.async) {
                                    return nodeFixer;
                                }
                                else {
                                    functionExpression.async = true;
                                    return [
                                        nodeFixer,
                                        fixer.insertTextBefore(functionExpression, 'async '),
                                    ];
                                }
                            }
                            return null;
                        },
                    });
                }
            },
        };
    },
});
