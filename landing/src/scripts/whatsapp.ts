export type Plataforma = 'android' | 'ios' | 'otra';

export const soloDigitos = (numero: string) => numero.replace(/\D/g, '');

export function plataforma(agente: string): Plataforma {
  if (/android/i.test(agente)) return 'android';
  if (/iphone|ipad|ipod/i.test(agente)) return 'ios';
  return 'otra';
}

export const dentroDeLinkedin = (agente: string) => /linkedinapp/i.test(agente);

export function enlaceWhatsapp(digitos: string, donde: Plataforma): string {
  const web = `https://wa.me/${digitos}`;
  if (donde === 'android') {
    return `intent://send?phone=${digitos}#Intent;scheme=whatsapp;S.browser_fallback_url=${encodeURIComponent(web)};end`;
  }
  if (donde === 'ios') return `whatsapp://send?phone=${digitos}`;
  return web;
}
