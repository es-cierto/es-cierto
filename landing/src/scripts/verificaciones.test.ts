import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Respuesta, cuantasFuentes, fecha, legible, urlDeInvestigacion, urlDePagina } from './verificaciones.ts';

const bot = 'https://escierto.cierto.workers.dev';

test('la respuesta del bot se valida: un id que no es UUID se rechaza', () => {
  const item = {
    id: 'a3cddb6c-755e-43d2-8550-90fd4fd9d4fc',
    afirmacion: 'x',
    veredicto: 'enganoso',
    confianza: 'alta',
    resumen: 'y',
    fuentes: 3,
    corregida: false,
    creadoEn: 1791667846000,
  };
  assert.equal(Respuesta.parse({ items: [item], siguiente: null }).items.length, 1);
  assert.throws(() => Respuesta.parse({ items: [{ ...item, id: '../../otra-cosa' }], siguiente: null }));
});

test('la primera página pide el límite; las siguientes, desde la última fecha', () => {
  assert.equal(urlDePagina(bot, 3), 'https://escierto.cierto.workers.dev/api/investigaciones?limite=3');
  assert.equal(
    urlDePagina(bot, 12, 1791667846000),
    'https://escierto.cierto.workers.dev/api/investigaciones?limite=12&antes=1791667846000',
  );
});

test('cada tarjeta enlaza a la página de su investigación en el bot', () => {
  assert.equal(
    urlDeInvestigacion(bot, 'a3cddb6c-755e-43d2-8550-90fd4fd9d4fc'),
    'https://escierto.cierto.workers.dev/a/a3cddb6c-755e-43d2-8550-90fd4fd9d4fc',
  );
});

test('la fecha va en español y en hora de Chile', () => {
  // 10 de octubre de 2026, 21:30 UTC = 18:30 en Chile.
  assert.equal(fecha(Date.UTC(2026, 9, 10, 21, 30)), '10 de octubre de 2026');
  // 11 de octubre, 01:00 UTC todavía es 10 de octubre en Chile.
  assert.equal(fecha(Date.UTC(2026, 9, 11, 1, 0)), '10 de octubre de 2026');
});

test('fuentes en singular y plural', () => {
  assert.equal(cuantasFuentes(1), '1 fuente');
  assert.equal(cuantasFuentes(3), '3 fuentes');
});

test('los espacios angostos del modelo se muestran como espacios comunes', () => {
  assert.equal(legible('el 1\u202Fde\u202Fmayo\u00A0de 2025'), 'el 1 de mayo de 2025');
});
