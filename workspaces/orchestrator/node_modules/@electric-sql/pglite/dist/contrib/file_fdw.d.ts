import { d as PGliteInterface } from '../pglite-CntadC_p.js';

declare const file_fdw: {
    name: string;
    setup: (_pg: PGliteInterface, _emscriptenOpts: any) => Promise<{
        bundlePath: URL;
    }>;
};

export { file_fdw };
