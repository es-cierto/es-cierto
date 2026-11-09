import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dentroDeLinkedin, enlaceWhatsapp, plataforma, soloDigitos } from './whatsapp.ts';

const android =
  'Mozilla/5.0 (Linux; Android 14; SM-A546E Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0.6668.100 Mobile Safari/537.36 [LinkedInApp]/4.1.1007';
const iphone =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [LinkedInApp]/9.30.1210';
const escritorio =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

test('el número escrito para personas queda en los dígitos que pide WhatsApp', () => {
  assert.equal(soloDigitos('+56 9 2212 2033'), '56922122033');
});

test('se reconoce el teléfono y si se abrió dentro de LinkedIn', () => {
  assert.equal(plataforma(android), 'android');
  assert.equal(plataforma(iphone), 'ios');
  assert.equal(plataforma(escritorio), 'otra');
  assert.equal(dentroDeLinkedin(android), true);
  assert.equal(dentroDeLinkedin(escritorio), false);
});

test('cada teléfono recibe el enlace que abre la app; si no la tiene, cae en wa.me', () => {
  assert.equal(
    enlaceWhatsapp('56922122033', 'android'),
    'intent://send?phone=56922122033#Intent;scheme=whatsapp;S.browser_fallback_url=https%3A%2F%2Fwa.me%2F56922122033;end',
  );
  assert.equal(enlaceWhatsapp('56922122033', 'ios'), 'whatsapp://send?phone=56922122033');
  assert.equal(enlaceWhatsapp('56922122033', 'otra'), 'https://wa.me/56922122033');
});
