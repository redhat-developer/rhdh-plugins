export declare type PathTemplate = string;
export declare type ParameterName = string;
export interface ParameterPatterns {
    [parameterName: string]: RegExp;
}
export interface Parameters {
    [parameterName: string]: string;
}
export declare type Path = string;
export declare type ParametersFn = (path: Path) => Parameters | null;
export declare type PathFn = (params: Parameters) => Path | null;
export declare type Bath = (template: PathTemplate, patterns?: ParameterPatterns) => {
    names: ParameterName[];
    path: PathFn;
    params: ParametersFn;
};
export declare type PathPattern = RegExp;
export declare type ParameterPattern = NP[];
export declare type NP = {
    name: string;
} & {
    pattern: RegExp | null;
};
export interface V {
    value: string;
}
export declare type NPV = NP & V;
