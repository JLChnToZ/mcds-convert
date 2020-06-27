import { readFile, writeFile, exists } from 'fs';
import { gunzip, gzip, InputType } from 'zlib';
import { resolve as resolvePath } from 'path';
import { stringify as toSNBT, parse as fromSNBT, encode as toNBT, decode as fromNBT } from 'nbt-ts';
import { promisify } from 'util';
import { encode as encodeString } from 'iconv-lite';
import { get as httpGet, IncomingMessage } from 'http';
import { get as httpsGet } from 'https';
import { URL } from 'url';

export const readFileAsync = promisify(readFile);
export const writeFileAsync = promisify(writeFile);
export const existsAsync = promisify(exists);
export const gunzipAsync = promisify<InputType, Buffer>(gunzip);
export const gzipAsync = promisify<InputType, Buffer>(gzip);

const defaultNamespace = 'minecraft';
const extPattern = /\.[a-z0-9]+$/;
const namespacedIdPattern = /^(\#?)([\w-]+\:)?([\w-]*)((?:\/[\w-]+)*)$/;
const dataUriPattern = /^data:(\w+\/[-+.\w]+)?(?:;((?:charset=([\w-]+))|base64))?,(.*)/;
const absolutePathPrefixPattern = /^([a-z]:)?[\\\/]/i;


export interface MimeBuffer extends Buffer {
  type?: string;
}

export function pathToNamespacedId(pathSplitted: string[]) {
  let nsid = pathSplitted[1].toLowerCase() === defaultNamespace ? '' : `${pathSplitted[1]}:`;
  let type = pathSplitted[2];
  if(type === 'tags') {
    if(pathSplitted.length < 5)
      return;
    nsid = `#${nsid}${pathSplitted.slice(4).join('/')}`;
    type = pathSplitted[3];
  } else
    nsid += pathSplitted.slice(3).join('/');
  nsid = nsid.replace(extPattern, '');
  if(nsid[nsid.length - 1] === ':')
    nsid = nsid.substring(0, nsid.length - 1);
  nsid = nsid.toLowerCase();
  return { type, nsid };
}

export function namespacedIdToPath(nsid: string, type: string) {
  const m = namespacedIdPattern.exec(nsid);
  if(!m) throw new TypeError('Invalid Namespaced ID');
  let path = 'data/';
  path += m[2] ? m[2].substring(0, m[2].length - 1) : defaultNamespace;
  if(m[1]) path += '/tags';
  path += `/${type}`;
  if(m[3]) path += `/${m[3]}`;
  if(m[4]) path += m[4];
  return path.toLowerCase();
}

export function fileUrl(filePath: string) {
  if(typeof filePath !== 'string')
    throw new Error('Filepath should be string');
  let pathName = resolvePath(filePath).replace(/\\/g, '/');
  if(pathName[0] !== '/')
    pathName = `/${pathName}`;
  return encodeURI(`file://${pathName}`);
}

export function decode(uri: string): MimeBuffer | null {
  const result = dataUriPattern.exec(uri.replace(/[\r\n\s]+/g, ''));
  return result && Object.assign(encodeString(
    decodeURI(result[4]),
    result[2] === 'base64' ? 'base64' :
    (result[3] || 'ascii')
  ), {
    type: result[1],
  });
}

export function fetch(url: string | URL): Promise<Buffer> {
  try {
    if(!url) throw new TypeError('Url is not provided.');
    let parsedUrl: URL;
    if(typeof url === 'string') {
      const data = decode(url);
      if(data) return Promise.resolve(data);
      if(absolutePathPrefixPattern.test(url))
        parsedUrl = new URL(fileUrl(url));
      else
        parsedUrl = new URL(url, fileUrl(process.cwd()));
    } else
      parsedUrl = url;
    switch(parsedUrl.protocol) {
      case 'file:':
        return readFileAsync(parsedUrl);
      case 'http:':
        return new Promise<IncomingMessage>((resolve, reject) =>
          httpGet(parsedUrl, resolve).on('error', reject),
        ).then(streamToBuffer);
      case 'https:':
        return new Promise<IncomingMessage>((resolve, reject) =>
          httpsGet(parsedUrl, resolve).on('error', reject),
        ).then(streamToBuffer);
      default:
        throw new TypeError('Unsupported protocol.');
    }
  } catch(err) {
    return Promise.reject(err);
  }
}

export function streamToArray<T = any>(stream: NodeJS.ReadableStream) {
  return new Promise<T[]>((resolve, reject) => {
    const data: T[] = [];
    stream.on('data', Array.prototype.push.bind(data))
    .on('end', () => resolve(data))
    .on('error', reject);
  });
}

export function streamToBuffer(stream: NodeJS.ReadableStream) {
  return streamToArray<Buffer>(stream).then(Buffer.concat);
}

export function isGZip(data: Buffer) {
  return data != null &&
    data.length >= 3 &&
    data[0] === 0x1F &&
    data[1] === 0x8B &&
    data[2] === 0x08;
}

export async function nbtToSnbt(data: Buffer | PromiseLike<Buffer>, breakLength?: number, quote: 'single' | 'double' = 'single') {
  const dataBuf = await data;
  const rawData = isGZip(dataBuf) ? await gunzipAsync(dataBuf) : dataBuf;
  return toSNBT(fromNBT(rawData).value!, { pretty: breakLength != null, breakLength, quote });
}

export function resolveResource(data: string | URL | Buffer) {
  if(Buffer.isBuffer(data))
    return Promise.resolve(data);
  try {
    if(typeof data === 'string' && /^[\s\r\n]*\{/.test(data))
      return gzipAsync(toNBT('root', fromSNBT(data)));
  } catch {}
  try {
    return fetch(data);
  } catch {}
  return Promise.resolve(Buffer.from(data));
}