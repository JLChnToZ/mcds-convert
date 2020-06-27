/// <reference types="node" />
import { readFile, writeFile, exists } from 'fs';
import { InputType } from 'zlib';
import { URL } from 'url';
export declare const readFileAsync: typeof readFile.__promisify__;
export declare const writeFileAsync: typeof writeFile.__promisify__;
export declare const existsAsync: typeof exists.__promisify__;
export declare const gunzipAsync: (arg1: InputType) => Promise<Buffer>;
export declare const gzipAsync: (arg1: InputType) => Promise<Buffer>;
export interface MimeBuffer extends Buffer {
    type?: string;
}
export declare function pathToNamespacedId(pathSplitted: string[]): {
    type: string;
    nsid: string;
} | undefined;
export declare function namespacedIdToPath(nsid: string, type: string): string;
export declare function fileUrl(filePath: string): string;
export declare function decode(uri: string): MimeBuffer | null;
export declare function fetch(url: string | URL): Promise<Buffer>;
export declare function streamToArray<T = any>(stream: NodeJS.ReadableStream): Promise<T[]>;
export declare function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer>;
export declare function isGZip(data: Buffer): boolean;
export declare function nbtToSnbt(data: Buffer | PromiseLike<Buffer>, breakLength?: number, quote?: 'single' | 'double'): Promise<string>;
export declare function resolveResource(data: string | URL | Buffer): Promise<Buffer>;
