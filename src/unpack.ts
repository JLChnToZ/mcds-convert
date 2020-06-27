import Zip from 'jszip';
import { dump as toYaml } from 'js-yaml';
import { dirname, extname, basename, join as joinPath, resolve as resolvePath } from 'path';
import { pathToNamespacedId, readFileAsync, writeFileAsync, nbtToSnbt } from './utils';

export async function unpack(input: string, output?: string, lineWidth?: number, snbt?: boolean) {
  input = resolvePath(input);
  if(!output) output = joinPath(dirname(input), basename(input, extname(input)) + '.json');
  let isYaml = false;
  switch(extname(output).toLowerCase()) {
    case '.yml': case '.yaml':
      isYaml = true;
      break;
  }
  const zipFile = await Zip.loadAsync(await readFileAsync(input));
  const result: any = {};
  const raw = await zipFile.file('pack.mcmeta')?.async('string');
  if(raw == null) throw new Error('`pack.mcmeta` does not exists at root.');
  Object.assign(result, JSON.parse(raw));
  for(const file of Object.keys(zipFile.files)) {
    const splittedFile = file.split('/');
    const fileName = splittedFile[splittedFile.length - 1];
    if(splittedFile.length === 1 && fileName === 'pack.mcmeta')
      continue;
    if(splittedFile.length > 2 && splittedFile[0] === 'data') {
      const nsidType = pathToNamespacedId(splittedFile);
      if(!nsidType) continue;
      const { nsid, type } = nsidType;
      if(!type || !nsid)
        continue;
      if(!result[type])
        result[type] = {};
      const ext = extname(fileName);
      switch(type) {
        case 'structures':
          if(ext === '.nbt') {
            if(snbt)
              result[type][nsid] = await nbtToSnbt(
                zipFile.files[file].async('nodebuffer'),
                isYaml && lineWidth != null ? lineWidth - 20 : undefined,
              );
            else
              result[type][nsid] = isYaml ?
                await zipFile.files[file].async('nodebuffer') :
                `data:application/x-minecraft-nbt;base64,${await zipFile.files[file].async('base64')}`;
          }
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
  await writeFileAsync(output, isYaml ? toYaml(result, { lineWidth, condenseFlow: lineWidth == null }) : JSON.stringify(result, null, 2));
}