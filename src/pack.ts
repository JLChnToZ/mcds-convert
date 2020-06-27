import Zip from 'jszip';
import { load as fromYaml } from 'js-yaml';
import { dirname, extname, basename, resolve as resolvePath } from 'path';
import { readFileAsync, namespacedIdToPath, writeFileAsync, resolveResource } from './utils';

export async function pack(input: string, output?: string) {
  const originalDir = process.cwd();
  input = resolvePath(input);
  process.chdir(dirname(input));
  if(!output) output = resolvePath(basename(input, extname(input)) + '.zip');
  let isYaml = false;
  switch(extname(input).toLowerCase()) {
    case '.yml': case '.yaml':
      isYaml = true;
      break;
  }
  const raw = await readFileAsync(input, 'utf8');
  const data = isYaml ? fromYaml(raw, { filename: input }) : JSON.parse(raw);
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
              zipFile.file(`${path}.nbt`, await resolveResource(content[nsid]));
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
  await writeFileAsync(resolvePath(originalDir, output), await zipFile.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  }));
}