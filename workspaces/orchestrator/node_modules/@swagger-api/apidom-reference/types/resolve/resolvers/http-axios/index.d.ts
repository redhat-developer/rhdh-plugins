import { Axios, AxiosInstance, CreateAxiosDefaults } from 'axios';
import HTTPResolver, { HTTPResolverOptions } from '../HTTPResolver';
import File from '../../../File';
interface HTTPResolverAxiosConfig extends CreateAxiosDefaults {
    interceptors?: Axios['interceptors'];
}
export interface HTTPResolverAxiosOptions extends Omit<HTTPResolverOptions, 'name'> {
    readonly axiosConfig?: HTTPResolverAxiosConfig;
}
declare class HTTPResolverAxios extends HTTPResolver {
    axiosConfig: HTTPResolverAxiosConfig;
    protected axiosInstance: AxiosInstance;
    protected previousAxiosConfig: HTTPResolverAxiosConfig;
    constructor(options?: HTTPResolverAxiosOptions);
    getHttpClient(): AxiosInstance;
    read(file: File): Promise<Buffer>;
}
export default HTTPResolverAxios;
