import Zip from 'jszip';
import { dump as toYaml } from 'js-yaml';
import { dirname, extname, basename, join as joinPath, resolve as resolvePath } from 'path';
import { pathToNamespacedId, writeFileAsync, nbtToSnbt, readFileAsync, resolveTo } from './utils';
import JSZip from 'jszip';

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

export async function unpack(inputData: Buffer, options: UnpackOptions) {
  const zipFile = await Zip.loadAsync(inputData);
  const result: any = {};
  const raw = await zipFile.file('pack.mcmeta')?.async('string');
  if(raw == null) throw new Error('`pack.mcmeta` does not exists at root.');
  Object.assign(result, JSON.parse(raw));
  const co: Promise<any>[] = [];
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
          if(ext === '.nbt' && options.nbt)
            co.push(resolveTo(unpackNBT(zipFile, file, options), result[type], nsid));
          break;
        case 'functions':
          if(nsid[0] !== '#' && ext === '.mcfunction') {
            co.push(resolveTo(unpackMCFunction(zipFile, file, options), result[type], nsid));
            break;
          }
        default:
          if(ext === '.json')
            co.push(resolveTo(unpackJSON(zipFile, file), result[type], nsid));
          break;
      }
    }
  }
  await Promise.all(co);
  return options.yaml ? toYaml(result, {
    lineWidth: options.lineWidth,
    condenseFlow: !options.pretty,
  }) : JSON.stringify(result, null, options.pretty ? 2 : 0);
}

async function unpackNBT(zipFile: JSZip, file: string, options: UnpackOptions) {
  return options.snbt ?
    nbtToSnbt(
      zipFile.files[file].async('nodebuffer'),
      options.pretty,
      options.yaml && options.lineWidth != null ? options.lineWidth - 20 : undefined,
    ) :
  options.yaml ?
    zipFile.files[file].async('nodebuffer') :
  `data:application/x-minecraft-nbt;base64,${await zipFile.files[file].async('base64')}`;
}

async function unpackMCFunction(zipFile: JSZip, file: string, options: UnpackOptions) {
  const result = await zipFile.files[file].async('string');
  return options.yaml ? result : result.split(/[\r\n]+/);
}

async function unpackJSON(zipFile: JSZip, file: string) {
  return JSON.parse(await zipFile.files[file].async('string'));
}

export async function unpackToFile(options: UnpackToFileOptions) {
  const opt = Object.assign({}, options);
  opt.input = resolvePath(opt.input);
  opt.output = options.output || joinPath(dirname(opt.input), basename(opt.input, extname(opt.input)) + (opt.yaml === false ? '.json' : '.yml'));
  if(options.yaml == null)
    switch(extname(opt.output).toLowerCase()) {
      case '.yml': case '.yaml':
        opt.yaml = true;
        break;
    }
  console.error(`Start parse ${opt.input}.`);
  await writeFileAsync(opt.output, await unpack(await readFileAsync(opt.input), opt));
  console.error(`Successfully write into ${opt.output}.`);
}
