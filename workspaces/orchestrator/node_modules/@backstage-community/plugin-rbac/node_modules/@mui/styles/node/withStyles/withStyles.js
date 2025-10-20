"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _hoistNonReactStatics = _interopRequireDefault(require("hoist-non-react-statics"));
var _utils = require("@mui/utils");
var _makeStyles = _interopRequireDefault(require("../makeStyles"));
var _getThemeProps = _interopRequireDefault(require("../getThemeProps"));
var _useTheme = _interopRequireDefault(require("../useTheme"));
var _jsxRuntime = require("react/jsx-runtime");
// Link a style sheet with a component.
// It does not modify the component passed to it;
// instead, it returns a new component, with a `classes` property.
const withStyles = (stylesOrCreator, options = {}) => Component => {
  const {
    defaultTheme,
    withTheme = false,
    name,
    ...stylesOptions
  } = options;
  if (process.env.NODE_ENV !== 'production') {
    if (Component === undefined) {
      throw new Error(['You are calling withStyles(styles)(Component) with an undefined component.', 'You may have forgotten to import it.'].join('\n'));
    }
  }
  let classNamePrefix = name;
  if (process.env.NODE_ENV !== 'production') {
    if (!name) {
      // Provide a better DX outside production.
      const displayName = (0, _utils.getDisplayName)(Component);
      if (displayName !== undefined) {
        classNamePrefix = displayName;
      }
    }
  }
  const useStyles = (0, _makeStyles.default)(stylesOrCreator, {
    defaultTheme,
    Component,
    name: name || Component.displayName,
    classNamePrefix,
    ...stylesOptions
  });
  const WithStyles = /*#__PURE__*/React.forwardRef(function WithStyles(props, ref) {
    const {
      classes: classesProp,
      ...other
    } = props;
    // The wrapper receives only user supplied props, which could be a subset of
    // the actual props Component might receive due to merging with defaultProps.
    // So copying it here would give us the same result in the wrapper as well.
    const classes = useStyles({
      ...Component.defaultProps,
      ...props
    });
    let theme;
    let more = other;
    if (typeof name === 'string' || withTheme) {
      // name and withTheme are invariant in the outer scope
      // TODO: uncomment once we enable eslint-plugin-react-compiler // eslint-disable-next-line react-compiler/react-compiler
      // eslint-disable-next-line react-hooks/rules-of-hooks
      theme = (0, _useTheme.default)() || defaultTheme;
      if (name) {
        more = (0, _getThemeProps.default)({
          theme,
          name,
          props: other
        });
      }

      // Provide the theme to the wrapped component.
      // So we don't have to use the `withTheme()` Higher-order Component.
      if (withTheme && !more.theme) {
        more.theme = theme;
      }
    }
    return /*#__PURE__*/(0, _jsxRuntime.jsx)(Component, {
      ref: ref,
      classes: classes,
      ...more
    });
  });
  process.env.NODE_ENV !== "production" ? WithStyles.propTypes = {
    /**
     * Override or extend the styles applied to the component.
     */
    classes: _propTypes.default.object
  } : void 0;
  if (process.env.NODE_ENV !== 'production') {
    WithStyles.displayName = `WithStyles(${(0, _utils.getDisplayName)(Component)})`;
  }
  (0, _hoistNonReactStatics.default)(WithStyles, Component);
  if (process.env.NODE_ENV !== 'production') {
    // Exposed for test purposes.
    WithStyles.Naked = Component;
    WithStyles.options = options;
    WithStyles.useStyles = useStyles;
  }
  return WithStyles;
};
var _default = exports.default = withStyles;