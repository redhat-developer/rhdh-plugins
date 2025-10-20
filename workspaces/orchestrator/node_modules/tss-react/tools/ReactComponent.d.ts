import type { FC, ComponentClass } from "react";
export declare type ReactComponent<Props> = ((props: Props) => ReturnType<FC>) | ComponentClass<Props>;
