import { d as PGliteInterface } from '../pglite-CntadC_p.js';

declare const dict_xsyn: {
    name: string;
    setup: (_pg: PGliteInterface, _emscriptenOpts: any) => Promise<{
        bundlePath: URL;
    }>;
};

export { dict_xsyn };
