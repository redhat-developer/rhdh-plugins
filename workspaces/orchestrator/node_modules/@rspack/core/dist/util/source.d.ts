import type { JsCompatSourceOwned } from "@rspack/binding";
import { Source } from "../../compiled/webpack-sources";
declare class JsSource extends Source {
    static __from_binding(source: JsCompatSourceOwned): Source;
    static __to_binding(source: Source): JsCompatSourceOwned;
}
export { JsSource };
