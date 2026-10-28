import { dentroDeLinkedin, enlaceWhatsapp, plataforma, soloDigitos } from './whatsapp';

const raiz = document.querySelector<HTMLElement>('[data-whatsapp]');
if (raiz) {
  const numero = raiz.dataset.numero!;
  const agente = navigator.userAgent;
  raiz.querySelector<HTMLAnchorElement>('[data-abrir]')!.href = enlaceWhatsapp(soloDigitos(numero), plataforma(agente));
  if (dentroDeLinkedin(agente)) raiz.querySelector<HTMLElement>('[data-ayuda]')!.classList.add('text-papel');
  const estado = raiz.querySelector<HTMLElement>('[data-estado]')!;
  raiz.querySelector<HTMLButtonElement>('[data-copiar]')!.addEventListener('click', () => {
    navigator.clipboard.writeText(numero).then(
      () => (estado.textContent = raiz.dataset.copiado!),
      () => (estado.textContent = raiz.dataset.sinCopiar!),
    );
  });
}
