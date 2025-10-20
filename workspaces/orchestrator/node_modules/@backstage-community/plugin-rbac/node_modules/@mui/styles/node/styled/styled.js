"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = styled;
var React = _interopRequireWildcard(require("react"));
var _clsx = _interopRequireDefault(require("clsx"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _utils = require("@mui/utils");
var _hoistNonReactStatics = _interopRequireDefault(require("hoist-non-react-statics"));
var _makeStyles = _interopRequireDefault(require("../makeStyles"));
var _jsxRuntime = require("react/jsx-runtime");
function omit(input, fields) {
  const output = {};
  Object.keys(input).forEach(prop => {
    if (!fields.includes(prop)) {
      output[prop] = input[prop];
    }
  });
  return output;
}

// styled-components's API removes the mapping between components and styles.
// Using components as a low-level styling construct can be simpler.
function styled(Component) {
  const componentCreator = (style, options = {}) => {
    const {
      name,
      ...stylesOptions
    } = options;
    if (process.env.NODE_ENV !== 'production' && Component === undefined) {
      throw new Error(['You are calling styled(Component)(style) with an undefined component.', 'You may have forgotten to import it.'].join('\n'));
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
    const stylesOrCreator = typeof style === 'function' ? theme => ({
      root: props => style({
        theme,
        ...props
      })
    }) : {
      root: style
    };
    const useStyles = (0, _makeStyles.default)(stylesOrCreator, {
      Component,
      name: name || Component.displayName,
      classNamePrefix,
      ...stylesOptions
    });
    let filterProps;
    let propTypes = {};
    if (style.filterProps) {
      filterProps = style.filterProps;
      delete style.filterProps;
    }

    /* eslint-disable react/forbid-foreign-prop-types */
    if (style.propTypes) {
      propTypes = style.propTypes;
      delete style.propTypes;
    }
    /* eslint-enable react/forbid-foreign-prop-types */

    const StyledComponent = /*#__PURE__*/React.forwardRef(function StyledComponent(props, ref) {
      const {
        children,
        className: classNameProp,
        clone,
        component: ComponentProp,
        ...other
      } = props;
      const classes = useStyles(props);
      const className = (0, _clsx.default)(classes.root, classNameProp);
      let spread = other;
      if (filterProps) {
        spread = omit(spread, filterProps);
      }
      if (clone) {
        return /*#__PURE__*/React.cloneElement(children, {
          className: (0, _clsx.default)(children.props.className, className),
          ...spread
        });
      }
      if (typeof children === 'function') {
        return children({
          className,
          ...spread
        });
      }
      const FinalComponent = ComponentProp || Component;
      return /*#__PURE__*/(0, _jsxRuntime.jsx)(FinalComponent, {
        ref: ref,
        className: className,
        ...spread,
        children: children
      });
    });
    process.env.NODE_ENV !== "production" ? StyledComponent.propTypes = {
      /**
       * A render function or node.
       */
      children: _propTypes.default.oneOfType([_propTypes.default.node, _propTypes.default.func]),
      /**
       * @ignore
       */
      className: _propTypes.default.string,
      /**
       * If `true`, the component will recycle it's children HTML element.
       * It's using `React.cloneElement` internally.
       *
       * This prop will be deprecated and removed in v5
       */
      clone: (0, _utils.chainPropTypes)(_propTypes.default.bool, props => {
        if (props.clone && props.component) {
          return new Error('You can not use the clone and component prop at the same time.');
        }
        return null;
      }),
      /**
       * The component used for the root node.
       * Either a string to use a HTML element or a component.
       */
      component: _propTypes.default /* @typescript-to-proptypes-ignore */.elementType,
      ...propTypes
    } : void 0;
    if (process.env.NODE_ENV !== 'production') {
      StyledComponent.displayName = `Styled(${classNamePrefix})`;
    }
    (0, _hoistNonReactStatics.default)(StyledComponent, Component);
    return StyledComponent;
  };
  return componentCreator;
}