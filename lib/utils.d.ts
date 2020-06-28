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
export declare function fileUrl(filePath: string, base?: string): string;
export declare function decode(uri: string): MimeBuffer | null;
export declare function tryParseURL(url: string | URL, base?: string): URL | MimeBuffer;
export declare function fetch(url: URL): Promise<Buffer>;
export declare function streamToArray<T = any>(stream: NodeJS.ReadableStream): Promise<T[]>;
export declare function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer>;
export declare function isGZip(data: Buffer): boolean;
export declare function nbtToSnbt(data: Buffer | PromiseLike<Buffer>, pretty?: boolean, breakLength?: number, quote?: 'single' | 'double'): Promise<string>;
export declare function resolveResource(data: string | URL | Buffer, base?: string, onPathDiscovered?: (path: URL) => void): Promise<Buffer>;
export declare function logError(error?: any): void;
export declare function debounce<A extends any[]>(fn: (...args: A) => void, delay: number): (...args: A) => void;
export declare function queuePromise<A extends any[], R>(fn: (...args: A) => PromiseLike<R>): (...args: A) => Promise<R>;
export declare function resolveTo<T, K extends keyof T>(src: PromiseLike<T[K]> | T[K], target: T, key: K): Promise<void>;
