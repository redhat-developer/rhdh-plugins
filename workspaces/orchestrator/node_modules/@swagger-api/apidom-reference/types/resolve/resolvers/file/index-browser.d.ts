import Resolver from '../Resolver';
declare class FileResolver extends Resolver {
    constructor();
    canRead(): boolean;
    read(): Promise<Buffer>;
}
export default FileResolver;
