import File from '../../../File';
import Resolver, { ResolverOptions } from '../Resolver';
export interface FileResolverOptions extends Omit<ResolverOptions, 'name'> {
    readonly fileAllowList?: string[] | RegExp[];
}
declare class FileResolver extends Resolver {
    fileAllowList: string[] | RegExp[];
    constructor(options?: FileResolverOptions);
    canRead(file: File): boolean;
    read(file: File): Promise<Buffer>;
}
export default FileResolver;
