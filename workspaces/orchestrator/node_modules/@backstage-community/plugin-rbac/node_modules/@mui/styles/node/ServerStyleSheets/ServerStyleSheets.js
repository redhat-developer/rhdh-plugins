"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _jss = require("jss");
var _StylesProvider = _interopRequireDefault(require("../StylesProvider"));
var _createGenerateClassName = _interopRequireDefault(require("../createGenerateClassName"));
var _jsxRuntime = require("react/jsx-runtime");
class ServerStyleSheets {
  constructor(options = {}) {
    this.options = options;
  }
  collect(children) {
    // This is needed in order to deduplicate the injection of CSS in the page.
    const sheetsManager = new Map();
    // This is needed in order to inject the critical CSS.
    this.sheetsRegistry = new _jss.SheetsRegistry();
    // A new class name generator
    const generateClassName = (0, _createGenerateClassName.default)();
    return /*#__PURE__*/(0, _jsxRuntime.jsx)(_StylesProvider.default, {
      sheetsManager: sheetsManager,
      serverGenerateClassName: generateClassName,
      sheetsRegistry: this.sheetsRegistry,
      ...this.options,
      children: children
    });
  }
  toString() {
    return this.sheetsRegistry ? this.sheetsRegistry.toString() : '';
  }
  getStyleElement(props) {
    return /*#__PURE__*/React.createElement('style', {
      id: 'jss-server-side',
      key: 'jss-server-side',
      dangerouslySetInnerHTML: {
        __html: this.toString()
      },
      ...props
    });
  }
}
exports.default = ServerStyleSheets;