"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.withThemeCreator = withThemeCreator;
var React = _interopRequireWildcard(require("react"));
var _hoistNonReactStatics = _interopRequireDefault(require("hoist-non-react-statics"));
var _utils = require("@mui/utils");
var _useTheme = _interopRequireDefault(require("../useTheme"));
var _jsxRuntime = require("react/jsx-runtime");
function withThemeCreator(options = {}) {
  const {
    defaultTheme
  } = options;
  const withTheme = Component => {
    if (process.env.NODE_ENV !== 'production') {
      if (Component === undefined) {
        throw new Error(['You are calling withTheme(Component) with an undefined component.', 'You may have forgotten to import it.'].join('\n'));
      }
    }
    const WithTheme = /*#__PURE__*/React.forwardRef(function WithTheme(props, ref) {
      const theme = (0, _useTheme.default)() || defaultTheme;
      return /*#__PURE__*/(0, _jsxRuntime.jsx)(Component, {
        theme: theme,
        ref: ref,
        ...props
      });
    });
    if (process.env.NODE_ENV !== 'production') {
      WithTheme.displayName = `WithTheme(${(0, _utils.getDisplayName)(Component)})`;
    }
    (0, _hoistNonReactStatics.default)(WithTheme, Component);
    if (process.env.NODE_ENV !== 'production') {
      // Exposed for test purposes.
      WithTheme.Naked = Component;
    }
    return WithTheme;
  };
  return withTheme;
}

// Provide the theme object as a prop to the input component.
// It's an alternative API to useTheme().
// We encourage the usage of useTheme() where possible.
const withTheme = withThemeCreator();
var _default = exports.default = withTheme;