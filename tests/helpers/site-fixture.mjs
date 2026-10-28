import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const bundled = path.join(root, '.tools/hugo-0.146.7', process.platform === 'win32' ? 'hugo.exe' : 'hugo');
const executable = process.env.HUGO_BIN || (existsSync(bundled) ? bundled : 'hugo');
export async function fixture(files, config = {}) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'hugo-quality-'));
  const put = async (name, body) => {
    await mkdir(path.dirname(path.join(directory, name)), { recursive: true });
    await writeFile(path.join(directory, name), body);
  };
  await put('hugo.json', JSON.stringify({ baseURL: 'https://example.com/', ...config }));
  for (const [name, body] of Object.entries(files)) await put(name, body);
  return {
    directory,
    async build(extraConfig) {
      if (extraConfig) await put('override.json', JSON.stringify(extraConfig));
      const result = spawnSync(executable, ['--source', directory, '--config', extraConfig ? 'hugo.json,override.json' : 'hugo.json'], { encoding: 'utf8' });
      if (result.error) throw result.error;
      if (result.status !== 0) throw new Error(result.stderr);
      return readFile(path.join(directory, 'public/index.html'), 'utf8');
    },
    config() {
      const result = spawnSync(executable, ['config', '--source', directory, '--config', 'hugo.json,override.json', '--format', 'json'], { encoding: 'utf8' });
      if (result.error) throw result.error;
      if (result.status !== 0) throw new Error(result.stderr);
      return JSON.parse(result.stdout);
    },
    close: () => rm(directory, { recursive: true, force: true })
  };
}
export const source = relative => readFile(path.join(root, relative), 'utf8');
