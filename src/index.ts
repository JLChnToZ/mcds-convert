import 'source-map-support/register';
import yargs from 'yargs';
import { pack } from './pack';
import { unpack } from './unpack';

if(require.main === module)
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
    argv => pack(argv.file, argv.out),
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
    }),
    argv => unpack(argv.file, argv.out),
  )
  .demandCommand(1)
  .help()
  .parse();

export { pack } from './pack';
export { unpack } from './unpack';
