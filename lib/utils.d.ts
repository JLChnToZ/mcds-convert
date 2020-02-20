/// <reference types="node" />
import { readFile, writeFile, exists } from 'fs';
import { URL } from 'url';
export declare const readFileAsync: typeof readFile.__promisify__;
export declare const writeFileAsync: typeof writeFile.__promisify__;
export declare const existsAsync: typeof exists.__promisify__;
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
export declare function resolveResource(data: string | URL | Buffer): Promise<Buffer>;
