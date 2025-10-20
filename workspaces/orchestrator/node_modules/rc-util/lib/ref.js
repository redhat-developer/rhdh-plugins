"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useComposeRef = exports.supportRef = exports.supportNodeRef = exports.getNodeRef = exports.fillRef = exports.composeRef = void 0;
var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));
var _react = require("react");
var _reactIs = require("react-is");
var _useMemo = _interopRequireDefault(require("./hooks/useMemo"));
var fillRef = exports.fillRef = function fillRef(ref, node) {
  if (typeof ref === 'function') {
    ref(node);
  } else if ((0, _typeof2.default)(ref) === 'object' && ref && 'current' in ref) {
    ref.current = node;
  }
};

/**
 * Merge refs into one ref function to support ref passing.
 */
var composeRef = exports.composeRef = function composeRef() {
  for (var _len = arguments.length, refs = new Array(_len), _key = 0; _key < _len; _key++) {
    refs[_key] = arguments[_key];
  }
  var refList = refs.filter(Boolean);
  if (refList.length <= 1) {
    return refList[0];
  }
  return function (node) {
    refs.forEach(function (ref) {
      fillRef(ref, node);
    });
  };
};
var useComposeRef = exports.useComposeRef = function useComposeRef() {
  for (var _len2 = arguments.length, refs = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    refs[_key2] = arguments[_key2];
  }
  return (0, _useMemo.default)(function () {
    return composeRef.apply(void 0, refs);
  }, refs, function (prev, next) {
    return prev.length !== next.length || prev.every(function (ref, i) {
      return ref !== next[i];
    });
  });
};
var supportRef = exports.supportRef = function supportRef(nodeOrComponent) {
  var _type$prototype, _nodeOrComponent$prot;
  var type = (0, _reactIs.isMemo)(nodeOrComponent) ? nodeOrComponent.type.type : nodeOrComponent.type;

  // Function component node
  if (typeof type === 'function' && !((_type$prototype = type.prototype) !== null && _type$prototype !== void 0 && _type$prototype.render) && type.$$typeof !== _reactIs.ForwardRef) {
    return false;
  }

  // Class component
  if (typeof nodeOrComponent === 'function' && !((_nodeOrComponent$prot = nodeOrComponent.prototype) !== null && _nodeOrComponent$prot !== void 0 && _nodeOrComponent$prot.render) && nodeOrComponent.$$typeof !== _reactIs.ForwardRef) {
    return false;
  }
  return true;
};
function isReactElement(node) {
  return /*#__PURE__*/(0, _react.isValidElement)(node) && !(0, _reactIs.isFragment)(node);
}
var supportNodeRef = exports.supportNodeRef = function supportNodeRef(node) {
  return isReactElement(node) && supportRef(node);
};

/**
 * In React 19. `ref` is not a property from node.
 * But a property from `props.ref`.
 * To check if `props.ref` exist or fallback to `ref`.
 */
var getNodeRef = exports.getNodeRef = Number(_react.version.split('.')[0]) >= 19 ?
// >= React 19
function (node) {
  if (isReactElement(node)) {
    return node.props.ref;
  }
  return null;
} :
// < React 19
function (node) {
  if (isReactElement(node)) {
    return node.ref;
  }
  return null;
};