import { readdir, readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { join } from 'node:path';
const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
await mkdir('docs/third-party-notices', { recursive: true });
const rows = []; const report = [];
for (const [path, meta] of Object.entries(lock.packages)) {
  if (!path) continue;
  const name = path.split('node_modules/').at(-1); let files;
  try { files = await readdir(path); } catch { rows.push({ name, version: meta.version, license: meta.license ?? 'UNDECLARED', installed: false, optional: Boolean(meta.optional), notices: [] }); continue; }
  const pkg = JSON.parse(await readFile(join(path, 'package.json'), 'utf8'));
  const notices = [];
  for (const f of files.filter(x => /^(licen[sc]e|copying|notice)(\.|$)/i.test(x))) {
    const target = `${name.replaceAll('/', '__').replaceAll('@', '')}-${meta.version}-${f}`;
    try { await copyFile(join(path, f), join('docs/third-party-notices', target)); notices.push(target); } catch (e) { throw new Error(`Failed to preserve license for ${name}: ${e.code}`); }
  }
  // The native binding tarball omits LICENSE; its matching JS package ships the upstream license.
  if (!notices.length && name.startsWith('@rolldown/binding-')) {
    const target = `${name.replaceAll('/', '__').replaceAll('@', '')}-${meta.version}-LICENSE`;
    const parent = JSON.parse(await readFile('node_modules/rolldown/package.json', 'utf8'));
    if (parent.version !== meta.version) throw new Error('Rolldown binding version does not match its license source');
    await copyFile('node_modules/rolldown/LICENSE', join('docs/third-party-notices', target)); notices.push(target);
  }
  const license = pkg.license ?? meta.license ?? 'UNDECLARED';
  rows.push({ name, version: meta.version, license, installed: true, optional: Boolean(meta.optional), notices });
  if (!notices.length || license === 'UNDECLARED') report.push(`${name}@${meta.version}: ${license}; ${notices.length} notice files`);
}
await writeFile('docs/dependency-inventory.json', JSON.stringify(rows, null, 2) + '\n');
const md = `# Third-party licenses\n\nGenerated from package-lock.json and installed package files. Original code: Apache-2.0. No candidate source code was copied. Full installed license/NOTICE files are preserved in [third-party-notices](third-party-notices/). Optional packages absent on this platform retain lockfile metadata but their license text has not been inspected locally. Re-run this script on each release platform.\n\n| Package | Version | License | Installed |\n| --- | --- | --- | --- |\n${rows.map(r => `| ${r.name} | ${r.version} | ${r.license} | ${r.installed} |`).join('\n')}\n\nReview flags:\n${report.length ? report.map(r => '- ' + r).join('\n') : 'None for installed packages.'}\n\nMIT/ISC/BSD notices must be preserved. Apache-2.0 packages retain their license and any NOTICE. Some dependencies bundle other works; retain complete upstream license files, including embedded notices. Vitest tooling dependencies may include bundled licenses. This inventory is not legal advice or a guarantee that npm metadata is complete. See OPEN_SOURCE_RESEARCH.md.\n`;
await writeFile('docs/THIRD_PARTY_LICENSES.md', md);
console.log(JSON.stringify({ total: rows.length, installed: rows.filter(r => r.installed).length, reviewFlags: report }));
