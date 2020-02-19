import Zip from 'jszip';
import { load as fromYaml } from 'js-yaml';
import fetch from 'node-fetch';
import { dirname, extname, basename, join as joinPath, resolve } from 'path';
import { readFile, writeFile } from 'fs';
import { promisify } from 'util';

const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);

const namespacedIdPattern = /^(\#?)([a-z0-9_-]+\:)?([a-z0-9_-]*)((?:\/[a-z0-9_-]+)*)$/;

function namespacedIdToPath(nsid: string, type: string) {
  const m = namespacedIdPattern.exec(nsid);
  if(!m) throw new TypeError('Invalid Namespaced ID');
  let path = 'data/';
  path += m[2] ? m[2].substring(0, m[2].length - 1) : 'minecraft';
  if(m[1]) path += '/tags';
  path += `/${type}`;
  if(m[3]) path += `/${m[3]}`;
  if(m[4]) path += m[4];
  return path;
}

export async function pack(input: string, output?: string) {
  const originalDir = process.cwd();
  process.chdir(dirname(input));
  if(!output) output = joinPath(dirname(input), basename(input, extname(input)) + '.zip');
  let isYaml = false;
  switch(extname(input).toLowerCase()) {
    case '.yml': case '.yaml':
      isYaml = true;
      break;
  }
  const raw = await readFileAsync(input, 'utf8');
  const data = isYaml ? fromYaml(raw) : JSON.parse(raw);
  var zipFile = new Zip();
  zipFile.file('pack.mcmeta', JSON.stringify({ pack: data.pack }));
  for(const key of Object.keys(data)) {
    switch(key) {
      case 'pack':
        break;
      default: {
        const content = data[key];
        for(const nsid of Object.keys(content)) {
          const path = namespacedIdToPath(nsid, key);
          switch(key) {
            case 'structures':
              zipFile.file(`${path}.nbt`, (await fetch(content[nsid])).buffer());
              break;
            case 'functions':
              if(nsid.charAt(0) !== '#') {
                zipFile.file(
                  `${path}.mcfunction`,
                  Array.isArray(content[nsid]) ?
                    (content[nsid] as string[]).join('\n') :
                    content[nsid].toString(),
                );
                break;
              }
            default:
              zipFile.file(`${path}.json`, JSON.stringify(content[nsid]));
              break;
          }
        }
      }
    }
  }
  await writeFileAsync(resolve(originalDir, output), await zipFile.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  }));
}