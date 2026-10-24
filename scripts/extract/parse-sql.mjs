// Minimal parser for mysqldump-style `INSERT INTO `t` (`a`,`b`) VALUES (...),(...);` statements.
// Only the tables we need are parsed; everything else is skipped without tokenising values.
import { createReadStream } from 'node:fs';
import { createGunzip } from 'node:zlib';

async function readAll(path) {
  const stream = path.endsWith('.gz') ? createReadStream(path).pipe(createGunzip()) : createReadStream(path);
  const chunks = [];
  for await (const c of stream) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}

function parseValues(sql, i) {
  // i points just after "VALUES". Returns { rows, end }.
  const rows = [];
  const n = sql.length;
  while (i < n) {
    while (i < n && /\s|,/.test(sql[i])) i++;
    if (sql[i] === ';') return { rows, end: i + 1 };
    if (sql[i] !== '(') throw new Error(`Expected ( at ${i}: ${sql.slice(i, i + 40)}`);
    i++;
    const row = [];
    while (true) {
      while (sql[i] === ' ') i++;
      if (sql[i] === "'") {
        let s = '';
        i++;
        while (true) {
          const ch = sql[i];
          if (ch === '\\') {
            const nx = sql[i + 1];
            s += { n: '\n', r: '\r', t: '\t', 0: '\0', Z: '\x1a' }[nx] ?? nx;
            i += 2;
          } else if (ch === "'") {
            if (sql[i + 1] === "'") { s += "'"; i += 2; } else { i++; break; }
          } else { s += ch; i++; }
        }
        row.push(s);
      } else {
        let j = i;
        while (sql[j] !== ',' && sql[j] !== ')') j++;
        const tok = sql.slice(i, j).trim();
        row.push(tok === 'NULL' ? null : tok.startsWith('0x') ? tok : Number(tok));
        i = j;
      }
      if (sql[i] === ',') { i++; continue; }
      if (sql[i] === ')') { i++; break; }
      throw new Error(`Unexpected char at ${i}: ${sql.slice(i - 20, i + 20)}`);
    }
    rows.push(row);
  }
  throw new Error('Unterminated INSERT');
}

/** Returns { table: [ {col: value, ...}, ... ] } for the requested tables. */
export async function loadTables(path, wanted) {
  const sql = await readAll(path);
  const out = Object.fromEntries(wanted.map((t) => [t, []]));
  const re = /^INSERT INTO `([^`]+)` \(([^)]*)\) VALUES/gm;
  let m;
  while ((m = re.exec(sql))) {
    const [, table, colList] = m;
    if (!wanted.includes(table)) continue;
    const cols = colList.split(',').map((c) => c.trim().replace(/`/g, ''));
    const { rows, end } = parseValues(sql, re.lastIndex);
    for (const r of rows) out[table].push(Object.fromEntries(cols.map((c, k) => [c, r[k]])));
    re.lastIndex = end;
  }
  return out;
}
