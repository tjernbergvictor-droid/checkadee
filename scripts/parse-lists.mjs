import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { read, utils } from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const listorDir = path.resolve(root, '..', 'Listor');
const outDir = path.join(root, 'public', 'data');
mkdirSync(outDir, { recursive: true });

function slugify(sci) {
  return sci
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function cell(row, idx) {
  const v = row[idx];
  return v === undefined || v === null ? '' : String(v).trim();
}

function readSheet(file, sheetName) {
  const buf = readFileSync(path.join(listorDir, file));
  const wb = read(buf, { type: 'buffer', cellFormula: false });
  const sheet = wb.Sheets[sheetName || wb.SheetNames[0]];
  return utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
}

// ---------- VP11 ----------
function parseVP() {
  const rows = readSheet('VP11.xlsx', 'VP 11');
  const species = [];
  let order = { sci: '', sv: '', en: '' };
  let family = { sci: '', sv: '', en: '' };

  for (const row of rows) {
    const rank = cell(row, 2); // col C
    const taxon = cell(row, 3); // col D
    const engE = cell(row, 4); // col E
    const nameSv = cell(row, 11); // col L
    const nameEnM = cell(row, 12); // col M
    const notes = cell(row, 13); // col N

    if (rank === '1_ordning') {
      order = { sci: taxon, sv: nameSv, en: nameEnM || engE };
    } else if (rank === '2_familj') {
      family = { sci: taxon, sv: nameSv, en: nameEnM || engE };
    } else if (rank === '3_art' && taxon && taxon.includes(' ')) {
      species.push({
        id: slugify(taxon),
        rank: 'species',
        scientificName: taxon,
        nameSv,
        nameEn: nameEnM || engE,
        order: order.sci,
        orderSv: order.sv,
        family: family.sci,
        familySv: family.sv,
        familyEn: family.en,
        introduced: notes.includes('Intr.'),
      });
    }
  }
  return species;
}

// ---------- Sverigelistan ----------
function parseSverige() {
  const rows = readSheet('Sverigelista-2026.xlsx');
  const species = [];
  let order = { sci: '', sv: '' };
  let family = { sci: '', sv: '', en: '' };
  let category = 'ABC';
  let lastSpeciesId = null;

  const LATIN_RE = /^[A-ZÅÄÖ][a-zA-Zåäöé×.-]+( [a-zåäö×.-]+){0,2}$/;
  const ORDER_RE = /formes$/i;

  for (const row of rows) {
    const a = cell(row, 0); // A
    const e = cell(row, 4); // E
    const f = cell(row, 5); // F
    const g = cell(row, 6); // G
    const t = cell(row, 19) || cell(row, 20); // T or U

    if (a.startsWith('ARTER I KATEGORI D')) {
      category = 'D';
      order = { sci: '', sv: '' };
      family = { sci: '', sv: '', en: '' };
      continue;
    }
    if (a.startsWith('ARTER I KATEGORI E')) {
      category = 'E';
      order = { sci: '', sv: '' };
      family = { sci: '', sv: '', en: '' };
      continue;
    }
    if (a === 'RK' || a.startsWith('[See legend')) continue;

    const latin = t && LATIN_RE.test(t) ? t : e && LATIN_RE.test(e) ? e : '';
    if (!latin) continue;
    const words = latin.trim().split(/\s+/);
    const nameSv = f.replace(/^\s+/, '');
    const nameEn = g.replace(/^\s+/, '');

    if (words.length === 1) {
      if (!f) continue;
      if (ORDER_RE.test(latin)) {
        const sci = latin.charAt(0) + latin.slice(1).toLowerCase();
        order = { sci, sv: f };
      } else {
        family = { sci: latin, sv: f, en: g };
      }
    } else if (words.length === 2) {
      const id = slugify(latin);
      species.push({
        id,
        rank: 'species',
        scientificName: latin,
        nameSv,
        nameEn,
        order: order.sci,
        orderSv: order.sv,
        family: family.sci,
        familySv: family.sv,
        familyEn: family.en,
        category,
      });
      lastSpeciesId = id;
    } else if (words.length === 3 && lastSpeciesId) {
      species.push({
        id: slugify(latin),
        rank: 'subspecies',
        scientificName: latin,
        nameSv,
        nameEn,
        order: order.sci,
        orderSv: order.sv,
        family: family.sci,
        familySv: family.sv,
        familyEn: family.en,
        category,
        parentId: lastSpeciesId,
      });
    }
  }
  return species;
}

// ---------- AviList (global) ----------
function parseAviList() {
  const rows = readSheet('AviList-v2025b-10Jun2026-short.xlsx', 'AviList v2025b short');
  const species = [];
  let order = '';
  let family = '';
  let familyEn = '';

  for (const row of rows) {
    const rank = cell(row, 1); // B Taxon_rank
    const ord = cell(row, 2); // C
    const fam = cell(row, 3); // D
    const famEn = cell(row, 4); // E
    const sci = cell(row, 5); // F
    const engName = cell(row, 8); // I
    const iucn = cell(row, 12); // M
    const extinct = cell(row, 11); // L

    if (rank === 'order') {
      order = ord;
    } else if (rank === 'family') {
      family = fam;
      familyEn = famEn;
    } else if (rank === 'species' && sci) {
      species.push({
        id: slugify(sci),
        scientificName: sci,
        nameEn: engName,
        order,
        family,
        familyEn,
        iucn: iucn || undefined,
        extinct: extinct === 'Extinct' || extinct === 'Possibly Extinct' ? extinct : undefined,
      });
    }
  }
  return species;
}

console.log('Parsing VP11...');
const vp = parseVP();
console.log(`  -> ${vp.length} species`);

console.log('Parsing Sverigelistan...');
const sverige = parseSverige();
const svCounts = sverige.reduce((acc, s) => {
  const key = `${s.category}/${s.rank}`;
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});
console.log('  ->', svCounts);

console.log('Parsing AviList...');
const avilist = parseAviList();
console.log(`  -> ${avilist.length} species`);

const svenskaLookup = new Map();
for (const s of [...vp, ...sverige]) {
  if (s.nameSv && !svenskaLookup.has(s.scientificName)) {
    svenskaLookup.set(s.scientificName, s.nameSv);
  }
}
let backfilled = 0;
for (const s of avilist) {
  const sv = svenskaLookup.get(s.scientificName);
  if (sv) {
    s.nameSv = sv;
    backfilled++;
  }
}
console.log(`  -> backfilled Swedish names for ${backfilled} AviList species`);

writeFileSync(path.join(outDir, 'vp.json'), JSON.stringify({ id: 'vp', species: vp }));
writeFileSync(path.join(outDir, 'sverige.json'), JSON.stringify({ id: 'sverige', species: sverige }));
writeFileSync(path.join(outDir, 'avilist.json'), JSON.stringify({ id: 'avilist', species: avilist }));

console.log('Done. Wrote JSON files to', outDir);
