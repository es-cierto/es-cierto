import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ordenDeCarga, PAUSA, paradaActual, posicion, tramo } from './tramos.ts';

const marcas = [0, 1000, 2000, 3000];
const fin = 4000;

test('antes del recorrido y en la primera parada la cámara está en 0', () => {
  assert.equal(posicion(-50, marcas, fin), 0);
  assert.equal(posicion(0, marcas, fin), 0);
});

test('al comienzo de cada tramo la cámara espera en la parada para que se lea el texto', () => {
  assert.equal(posicion(1000 + 1000 * PAUSA * 0.9, marcas, fin), 1);
});

test('después de la pausa avanza hasta la parada siguiente', () => {
  const mitad = posicion(1000 + 1000 * (PAUSA + (1 - PAUSA) / 2), marcas, fin);
  assert.ok(mitad > 1.4 && mitad < 1.6, `mitad del tramo: ${mitad}`);
  assert.ok(posicion(1999, marcas, fin) > 1.99);
});

test('desde la última parada hasta el final, la cámara se queda en la última', () => {
  assert.equal(posicion(3500, marcas, fin), 3);
  assert.equal(posicion(9999, marcas, fin), 3);
});

test('la parada que se lee es la más cercana a la cámara', () => {
  assert.equal(paradaActual(1.4), 1);
  assert.equal(paradaActual(1.6), 2);
});

test('quieta en una parada no hay clip; en un tramo, el clip y su avance', () => {
  assert.equal(tramo(2, 3), null);
  assert.deepEqual(tramo(1.25, 3), { clip: 1, avance: 0.25 });
  assert.equal(tramo(3, 3), null);
});

test('se carga primero el clip del tramo actual y después el más cercano', () => {
  assert.deepEqual(ordenDeCarga([0, 1, 2], 0), [0, 1, 2]);

  assert.deepEqual(ordenDeCarga([0, 1, 2], 1.2), [1, 0, 2]);
});

test('a igual distancia se carga antes el clip que viene por delante', () => {
  assert.deepEqual(ordenDeCarga([0, 1, 2], 1.5), [1, 2, 0]);
});
