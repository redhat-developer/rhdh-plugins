"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classnames = void 0;
const assert_1 = require("./assert");
const typeGuard_1 = require("./typeGuard");
/** Copy pasted from
 * https://github.com/emotion-js/emotion/blob/23f43ab9f24d44219b0b007a00f4ac681fe8712e/packages/react/src/class-names.js#L17-L63
 **/
const classnames = (args) => {
    const len = args.length;
    let i = 0;
    let cls = "";
    for (; i < len; i++) {
        const arg = args[i];
        if (arg == null)
            continue;
        let toAdd;
        switch (typeof arg) {
            case "boolean":
                break;
            case "object": {
                if (Array.isArray(arg)) {
                    toAdd = (0, exports.classnames)(arg);
                }
                else {
                    (0, assert_1.assert)(!(0, typeGuard_1.typeGuard)(arg, false));
                    if (process.env.NODE_ENV !== "production" &&
                        arg.styles !== undefined &&
                        arg.name !== undefined) {
                        console.error("You have passed styles created with `css` from `@emotion/react` package to the `cx`.\n" +
                            "`cx` is meant to compose class names (strings) so you should convert those styles to a class name by passing them to the `css` received from <ClassNames/> component.");
                    }
                    toAdd = "";
                    for (const k in arg) {
                        if (arg[k] && k) {
                            toAdd && (toAdd += " ");
                            toAdd += k;
                        }
                    }
                }
                break;
            }
            default: {
                toAdd = arg;
            }
        }
        if (toAdd) {
            cls && (cls += " ");
            cls += toAdd;
        }
    }
    return cls;
};
exports.classnames = classnames;
