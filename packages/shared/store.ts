import { lstat, mkdir, readFile, realpath, rename, unlink, open } from 'node:fs/promises';
import { resolve, dirname, parse, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { StateSchema, type State } from './schemas.js';

export class AppError extends Error {
  constructor(public code: string, message: string) { super(message); }
}
const missing = (e: unknown) => (e as NodeJS.ErrnoException).code === 'ENOENT';
export async function rejectSymlinks(path: string): Promise<void> {
  const absolute = resolve(path); const root = parse(absolute).root;
  let current = root;
  for (const part of absolute.slice(root.length).split(/[\\/]/).filter(Boolean)) {
    current = join(current, part);
    try { if ((await lstat(current)).isSymbolicLink()) throw new AppError('UNSAFE_PATH', 'Symbolic links are not allowed in workspace paths'); }
    catch (e) { if (!missing(e)) throw e; }
  }
}
export async function readInput(path: string, limit = 2_100_000): Promise<string> {
  await rejectSymlinks(path);
  const info = await lstat(path);
  if (!info.isFile() || info.size > limit) throw new AppError('INPUT_LIMIT', 'Input must be a regular file within the size limit');
  return readFile(path, 'utf8');
}
export class Store {
  readonly root: string;
  constructor(root: string) { this.root = resolve(root); }
  async init(): Promise<void> { await rejectSymlinks(this.root); await mkdir(this.root, { recursive: true, mode: 0o700 }); await rejectSymlinks(this.root); }
  async read(): Promise<State> {
    await this.init(); const file = join(this.root, 'state.json');
    try { return StateSchema.parse(JSON.parse(await readInput(file, 32 * 1024 * 1024))); }
    catch (e) { if (missing(e)) return { schemaVersion: '1.0.0', brands: [], sources: [], items: [] }; throw e; }
  }
  async transaction<T>(fn: (state: State) => T | Promise<T>): Promise<T> {
    await this.init(); const lockPath = join(this.root, '.lock'); let lock;
    try { lock = await open(lockPath, 'wx', 0o600); }
    catch (e) { if ((e as NodeJS.ErrnoException).code === 'EEXIST') throw new AppError('WORKSPACE_BUSY', 'Workspace busy: lock exists. See troubleshooting before removing a stale lock.'); throw e; }
    try {
      await lock.writeFile(JSON.stringify({ pid: process.pid, at: new Date().toISOString() }));
      const state = await this.read(); const result = await fn(state); const validated = StateSchema.parse(state);
      const serialized = JSON.stringify(validated, null, 2);
      if (Buffer.byteLength(serialized) > 32 * 1024 * 1024) throw new AppError('STATE_LIMIT', 'Workspace exceeds the 32 MiB state limit');
      await this.atomic('state.json', serialized); return result;
    } finally { await lock.close(); await unlink(lockPath); }
  }
  async atomic(name: string, data: string): Promise<string> {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,100}$/.test(name) || /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(name) || /[. ]$/.test(name)) throw new AppError('UNSAFE_PATH', 'Use a simple safe filename without directories');
    await this.init(); const target = join(this.root, name); await rejectSymlinks(target);
    const temp = join(this.root, `.tmp-${randomUUID()}`); const handle = await open(temp, 'wx', 0o600);
    try { await handle.writeFile(data); await handle.sync(); } finally { await handle.close(); }
    try { await rejectSymlinks(target); await rename(temp, target); }
    catch (e) { await unlink(temp).catch(() => undefined); throw e; }
    return target;
  }
}
