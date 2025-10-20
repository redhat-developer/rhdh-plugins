import { d as PGliteInterface } from '../pglite-CntadC_p.cjs';

declare const btree_gin: {
    name: string;
    setup: (_pg: PGliteInterface, _emscriptenOpts: any) => Promise<{
        bundlePath: URL;
    }>;
};

export { btree_gin };
