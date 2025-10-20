"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useTheme;
var _useTheme = _interopRequireDefault(require("@mui/private-theming/useTheme"));
function useTheme() {
  const privateTheme = (0, _useTheme.default)();
  return privateTheme?.$$material ?? privateTheme;
}