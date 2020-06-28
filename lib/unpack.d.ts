/// <reference types="node" />
export interface UnpackOptions {
    yaml?: boolean;
    lineWidth?: number;
    nbt?: boolean;
    snbt?: boolean;
    pretty?: boolean;
}
export interface UnpackToFileOptions extends UnpackOptions {
    input: string;
    output?: string;
}
export declare function unpack(inputData: Buffer, options: UnpackOptions): Promise<string>;
export declare function unpackToFile(options: UnpackToFileOptions): Promise<void>;
