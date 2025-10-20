import { d as PGliteInterface } from '../pglite-CntadC_p.js';

declare const citext: {
    name: string;
    setup: (_pg: PGliteInterface, _emscriptenOpts: any) => Promise<{
        bundlePath: URL;
    }>;
};

export { citext };
