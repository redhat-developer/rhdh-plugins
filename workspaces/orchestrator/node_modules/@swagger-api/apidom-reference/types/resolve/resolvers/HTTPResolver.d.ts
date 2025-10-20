import Resolver, { ResolverOptions } from './Resolver';
import File from '../../File';
export interface HTTPResolverOptions extends ResolverOptions {
    readonly timeout?: number;
    readonly redirects?: number;
    readonly withCredentials?: boolean;
}
declare abstract class HTTPResolver extends Resolver {
    protected readonly timeout: number;
    protected readonly redirects: number;
    protected readonly withCredentials: boolean;
    constructor(options?: HTTPResolverOptions);
    canRead(file: File): boolean;
    abstract getHttpClient(): unknown;
}
export default HTTPResolver;
