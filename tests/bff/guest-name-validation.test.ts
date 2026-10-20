import {test} from 'node:test';
import assert from 'node:assert/strict';
import {filterGuestNameInput,validGuestName} from '@/lib/guestValidation';

test('guest names accept Unicode letters, combining accents, spaces, hyphens and apostrophes', () => {
  for (const name of ['María José', 'Jose\u0301', "O'Neill", 'D’Ávila', 'Jean-Luc', 'Anne‑Marie', 'Ana–María', '李 明', 'عبد الله', 'Ana  María']) assert.equal(validGuestName(name),true,name);
  for (const name of ['', '   ', "-'", 'Ana123', 'José２', 'Ana@', 'A/B', 'Ana🙂', '<script>', 'Ana\nMaría', 'Ana\t', 'Ana.']) assert.equal(validGuestName(name),false,name);
});

test('input filter removes digits and symbols without changing order, accents or separators', () => {
  assert.equal(filterGuestNameInput("1María2 José3-Ñúñez4 O'Neill@"),"María José-Ñúñez O'Neill");
  assert.equal(filterGuestNameInput('D’Ávila９🙂-李 明'),'D’Ávila-李 明');
  assert.equal(filterGuestNameInput('Jose\u0301'),'Jose\u0301');
  assert.equal(filterGuestNameInput('  Ana  María  '),'  Ana  María  ');
});
