import {createRepo, removeRepos, logMessage, runCommand, catchError} from '@gitsync/test';
import exec from '..';

afterAll(() => {
  removeRepos();
});

afterEach(() => {
  process.exitCode = 0;
});

describe('exec command', () => {
  test('run command success', async () => {
    const source = await createRepo();

    const target1 = await createRepo();
    await target1.commitFile('target1.txt');

    const target2 = await createRepo();
    await target2.commitFile('target2.txt');

    await source.addFile('.gitsync.json', JSON.stringify({
      repos: [
        {
          sourceDir: 'package-name1',
          target: target1.dir,
        },
        {
          sourceDir: 'package-name2',
          target: target2.dir,
        }
      ]
    }));

    await runCommand(exec, source, {
      cmd: 'git',
      args: [
        'log'
      ]
    });

    const message = logMessage();
    expect(message).toContain('add target1.txt');
    expect(message).toContain('add target2.txt');
  });

  test('run command fail', async () => {
    const source = await createRepo();

    const target1 = await createRepo();
    await target1.commitFile('target1.txt');

    const target2 = await createRepo();

    await source.addFile('.gitsync.json', JSON.stringify({
      repos: [
        {
          sourceDir: 'package-name1',
          target: target1.dir,
        },
        {
          sourceDir: 'package-name2',
          target: target2.dir,
        }
      ]
    }));

    await runCommand(exec, source, {
      cmd: 'git',
      args: [
        'log'
      ]
    });

    // fatal: your current branch 'abc' does not have any commits yet
    expect(process.exitCode).toBe(128);
  });
});


