import File from '../../File';
export interface ResolverOptions {
    readonly name: string;
}
declare abstract class Resolver {
    readonly name: string;
    constructor({ name }: ResolverOptions);
    abstract canRead(file: File): boolean;
    abstract read(file: File): Promise<Buffer>;
}
export default Resolver;
