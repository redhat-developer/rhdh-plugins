import { AxiosInstance, AxiosPromise, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Observable } from 'rxjs';
export declare class HttpService {
    protected readonly instance: AxiosInstance;
    constructor(instance?: AxiosInstance);
    request<T = any>(config: AxiosRequestConfig): Observable<AxiosResponse<T>>;
    get<T = any, D = any>(url: string, config?: AxiosRequestConfig<D>): Observable<AxiosResponse<T, D>>;
    delete<T = any, D = any>(url: string, config?: AxiosRequestConfig<D>): Observable<AxiosResponse<T, D>>;
    head<T = any, D = any>(url: string, config?: AxiosRequestConfig<D>): Observable<AxiosResponse<T, D>>;
    post<T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Observable<AxiosResponse<T, D>>;
    put<T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Observable<AxiosResponse<T, D>>;
    patch<T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Observable<AxiosResponse<T, D>>;
    postForm<T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Observable<AxiosResponse<T, D>>;
    putForm<T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Observable<AxiosResponse<T, D>>;
    patchForm<T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Observable<AxiosResponse<T, D>>;
    get axiosRef(): AxiosInstance;
    protected makeObservable<T>(axios: (...args: any[]) => AxiosPromise<T>, ...args: any[]): Observable<AxiosResponse<T, any>>;
}
