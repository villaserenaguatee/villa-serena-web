import {readFileSync} from 'node:fs';

const es = JSON.parse(readFileSync(new URL('../src/i18n/messages/es.json', import.meta.url),'utf8'));
const en = JSON.parse(readFileSync(new URL('../src/i18n/messages/en.json', import.meta.url),'utf8'));

function paths(value,prefix='') {
  return Object.entries(value).flatMap(([key,item]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return item && typeof item === 'object' ? paths(item,path) : [path];
  });
}

const esKeys = new Set(paths(es));
const enKeys = new Set(paths(en));
const missingEn = [...esKeys].filter(key => !enKeys.has(key));
const missingEs = [...enKeys].filter(key => !esKeys.has(key));

if (missingEn.length || missingEs.length) {
  if (missingEn.length) console.error('Faltan claves en inglés:\n- '+missingEn.join('\n- '));
  if (missingEs.length) console.error('Faltan claves en español:\n- '+missingEs.join('\n- '));
  process.exit(1);
}
console.log(`i18n correcto: ${esKeys.size} claves coinciden en español e inglés.`);
