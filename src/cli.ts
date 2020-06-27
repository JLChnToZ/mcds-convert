import 'source-map-support/register';
import yargs from 'yargs';
import { pack, unpack } from './';

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
  }),
  argv => pack(argv.file, argv.out).catch(logError),
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
  }),
  argv => unpack(argv.file, argv.out, argv.linemax, argv.snbt).catch(logError),
)
.demandCommand(1)
.help()
.parse();

function logError(error?: any) {
  console.error('An error occured!');
  console.error(error && typeof error === 'object' ? error.stack || error : error);
}
