import {Arguments, CommandModule} from 'yargs';
import {Config} from '@gitsync/config';
import log from '@gitsync/log';
import * as execa from 'execa';
import {promises as fsp} from "fs";
import theme from 'chalk-theme';

interface ExecArguments extends Arguments {
  cmd: string
  args: string[]
  include: string[]
  exclude: string[]
}

let command: CommandModule = {
  handler: () => {
  }
};

command.command = 'exec <cmd> [args..]';

command.describe = 'Sync current repository subdirectories to relative repositories that defined in the config file';

command.builder = {
  cmd: {
    describe: 'The command to execute',
    type: 'string',
  },
  args: {
    describe: 'The arguments pass to the command',
    type: 'array',
  },
  include: {
    describe: 'Include only source directory matching the given glob',
    default: [],
    type: 'array',
  },
  exclude: {
    describe: 'Exclude source directory matching the given glob',
    default: [],
    type: 'array',
  }
};

command.handler = async (argv: ExecArguments) => {
  argv.include || (argv.include = []);
  argv.exclude || (argv.exclude = []);

  const config = new Config();
  config.checkFileExist();

  const repos = config.filterReposBySourceDir(argv.include, argv.exclude);
  for (const repo of repos) {
    const repoDir = await config.getRepoDirByRepo(repo);
    if (!await isDir(repoDir)) {
      log.warn(`Repository directory "${theme.warning(repoDir)}" does not exist, skipping`);
      continue;
    }

    log.info(`Executing command in ${theme.info(repoDir)}`);
    try {
      const result = await execa(argv.cmd, argv.args, {
        cwd: repoDir
      });
      log.info(result.all);
    } catch (e) {
      process.exitCode = e.exitCode;
      log.warn(`${e.message} ${e.all}`);
    }
  }

  log.info('Done!');
}

async function isDir(dir: string) {
  try {
    return (await fsp.stat(dir)).isDirectory();
  } catch (e) {
    return false;
  }
}

export default command;
