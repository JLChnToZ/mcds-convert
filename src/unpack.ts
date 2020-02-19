import Zip from 'jszip';
import { dump as toYaml } from 'js-yaml';
import { dirname, extname, basename, join as joinPath } from 'path';
import { readFile, writeFile } from 'fs';
import { promisify } from 'util';

const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);

const extMatcher = /\.[a-z0-9]+$/;

function pathToNamespaceID(pathSplitted: string[]) {
  let nsid = pathSplitted[1] === 'minecraft' ? '' : `${pathSplitted[1]}:`;
  let type = pathSplitted[2];
  if(type === 'tags') {
    if(pathSplitted.length < 5)
      return;
    nsid = '#' + nsid + pathSplitted.slice(4).join('/');
    type = pathSplitted[3];
  } else
    nsid += pathSplitted.slice(3).join('/');
  nsid = nsid.replace(extMatcher, '');
  if(nsid[nsid.length - 1] === ':')
    nsid = nsid.substring(0, nsid.length - 1);
  return { type, nsid };
}

export async function unpack(input: string, output?: string) {
  if(!output) output = joinPath(dirname(input), basename(input, extname(input)) + '.json');
  let isYaml = false;
  switch(extname(output).toLowerCase()) {
    case '.yml': case '.yaml':
      isYaml = true;
      break;
  }
  const zipFile = await Zip.loadAsync(await readFileAsync(input));
  const result: any = {};
  Object.assign(result, JSON.parse(await zipFile.file('pack.mcmeta').async('string')));
  for(const file of Object.keys(zipFile.files)) {
    const splittedFile = file.split('/');
    const fileName = splittedFile[splittedFile.length - 1];
    if(splittedFile.length === 1 && fileName === 'pack.mcmeta')
      continue;
    if(splittedFile.length > 2 && splittedFile[0] === 'data') {
      const nsidType = pathToNamespaceID(splittedFile);
      if(!nsidType) continue;
      const { nsid, type } = nsidType;
      if(!type || !nsid)
        continue;
      if(!result[type])
        result[type] = {};
      const ext = extname(fileName);
      switch(type) {
        case 'structures':
          if(ext === '.nbt')
            result[type][nsid] = `data:application/octet-stream;base64,${await zipFile.files[file].async('base64')}`;
          break;
        case 'functions':
          if(nsid[0] !== '#' && ext === '.mcfunction') {
            result[type][nsid] = await zipFile.files[file].async('string');
            if(!isYaml) result[type][nsid] = result[type][nsid].split(/[\r\n]+/);
            break;
          }
        default:
          if(ext === '.json')
            result[type][nsid] = JSON.parse(await zipFile.files[file].async('string'));
          break;
      }
    }
  }
  await writeFileAsync(output, isYaml ? toYaml(result) : JSON.stringify(result, null, 2));
}