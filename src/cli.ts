import 'source-map-support/register';
import yargs from 'yargs';
import { packToFile } from './pack';
import { unpackToFile } from './unpack';
import { logError } from './utils';

yargs
.command(
  ['pack <file> [out]', 'p'],
  'Pack as zip file',
  y => y.positional('file', {
    describe: 'input file',
    type: 'string',
    demandOption: true,
  }).positional('out', {
    describe: 'Output file',
    type: 'string',
  }).options({
    watch: {
      alias: 'w',
      describe: 'Watch file changes',
      type: 'boolean',
      default: false,
    },
  }),
  argv => packToFile({
    input: argv.file,
    output: argv.out,
    watch: argv.watch,
  }).catch(logError),
)
.command(
  ['unpack <file> [out]', 'u'],
  'Unpack a zip file to single definition',
  y => y.positional('file', {
    describe: 'input file',
    type: 'string',
    demandOption: true,
  }).positional('out', {
    describe: 'Output file',
    type: 'string',
  }).options({
    linemax: {
      alias: 'l',
      describe: 'Max characters per line',
      type: 'number',
    },
    snbt: {
      alias: 's',
      describe: 'Extract NBT binaries to SNBT',
      default: false,
      type: 'boolean',
    },
    nbt: {
      alias: 'n',
      describe: 'Extract NBT files',
      default: true,
      type: 'boolean',
    },
    pretty: {
      alias: 'p',
      describe: 'Prettify output',
      default: true,
      type: 'boolean',
    },
  }),
  argv => unpackToFile({
    input: argv.file,
    output: argv.out,
    lineWidth: argv.linemax,
    nbt: argv.nbt,
    snbt: argv.snbt,
    pretty: argv.pretty,
  }).catch(logError),
)
.demandCommand(1)
.help()
.parse();
