/// <reference types="node" />
export interface PackOptions {
    yaml?: boolean;
    input?: string;
    base?: string;
}
export interface PackToFileOptions extends PackOptions {
    input: string;
    output?: string;
    watch?: boolean;
}
export declare function pack(raw: string, options: PackOptions): Promise<Buffer>;
export declare function packToFile(options: PackToFileOptions): Promise<void>;
