import Zip from 'jszip';
import { watch, FSWatcher } from 'chokidar';
import { load as fromYaml } from 'js-yaml';
import { resolveRefs } from 'json-refs';
import { dirname, extname, basename, resolve as resolvePath } from 'path';
import { readFileAsync, namespacedIdToPath, writeFileAsync, resolveResource, logError, debounce, queuePromise } from './utils';
import { URL, fileURLToPath } from 'url';

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

interface PackToFileInternalOptions extends PackToFileOptions {
  base: string;
  output: string;
  watcher?: FSWatcher;
  urlDiscoverCb?: (url: URL) => void;
}

export async function pack(raw: string, options: PackOptions) {
  const data = options.yaml ?
    fromYaml(raw, { filename: options.input }) :
    (await resolveRefs(JSON.parse(raw))).resolved;
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
              zipFile.file(`${path}.nbt`, resolveResource(
                content[nsid], options.base,
                (options as PackToFileInternalOptions).urlDiscoverCb,
              ));
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
  return zipFile.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });
}

export async function packToFile(options: PackToFileOptions) {
  const opt = Object.assign({}, options) as PackToFileInternalOptions;
  opt.input = options.base ? resolvePath(options.base, options.input) : resolvePath(options.input);
  if(!options.base) opt.base = dirname(opt.input);
  const inputExt = extname(opt.input);
  opt.output = resolvePath(options.output || basename(opt.input, inputExt) + '.zip');
  switch(inputExt.toLowerCase()) {
    case '.yml': case '.yaml':
      opt.yaml = true;
      break;
    default:
      opt.yaml = false;
      break;
  }
  if(options.watch) {
    console.error('Watch mode enabled!');
    opt.watcher = watch(opt.input, {
      ignoreInitial: true,
    }).on('change', debounce(queuePromise(
      () => packToFileExec(opt).catch(logError),
    ), 1000));
    opt.urlDiscoverCb = url => {
      if(url.protocol === 'file')
        opt.watcher?.add(fileURLToPath(url));
    };
  }
  await packToFileExec(opt);
}

async function packToFileExec(options: PackToFileInternalOptions) {
  console.error(`Start parse ${options.input}.`);
  await writeFileAsync(options.output, await pack(await readFileAsync(options.input, 'utf8'), options));
  console.error(`Successfully write into ${options.output}.`);
}
