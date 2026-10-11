import {
  Respuesta,
  cuantasFuentes,
  fecha,
  legible,
  urlDeInvestigacion,
  urlDePagina,
  type Item,
} from './verificaciones';

function tarjeta(plantilla: HTMLTemplateElement, item: Item, bot: string, raiz: HTMLElement): Node {
  const nodo = plantilla.content.cloneNode(true) as DocumentFragment;
  const campo = (nombre: string) => nodo.querySelector<HTMLElement>(`[data-campo="${nombre}"]`)!;
  const icono = raiz.querySelector<HTMLTemplateElement>(`template[data-icono="${item.veredicto}"]`);
  if (icono) campo('icono').append(icono.content.cloneNode(true));
  campo('veredicto').textContent =
    raiz.querySelector<HTMLElement>(`[data-nombre="${item.veredicto}"]`)?.textContent ?? '';
  campo('fecha').textContent = fecha(item.creadoEn);
  campo('afirmacion').textContent = `«${legible(item.afirmacion)}»`;
  campo('resumen').textContent = legible(item.resumen);
  campo('fuentes').textContent = cuantasFuentes(item.fuentes);
  campo('corregida').hidden = !item.corregida;
  const enlace = campo('enlace') as HTMLAnchorElement;
  enlace.href = urlDeInvestigacion(bot, item.id);
  return nodo;
}

async function iniciar(raiz: HTMLElement) {
  const bot = raiz.dataset.bot!;
  const limite = Number(raiz.dataset.limite ?? 12);
  const paginar = raiz.dataset.paginar === 'si';
  const lista = raiz.querySelector<HTMLElement>('[data-lista]')!;
  const plantilla = raiz.querySelector<HTMLTemplateElement>('template[data-tarjeta]')!;
  const estado = raiz.querySelector<HTMLElement>('[data-estado]')!;
  const mas = raiz.querySelector<HTMLButtonElement>('[data-mas]');

  let siguiente: number | null = null;
  const cargar = async (antes?: number | null) => {
    try {
      const respuesta = await fetch(urlDePagina(bot, limite, antes));
      if (!respuesta.ok) throw new Error(String(respuesta.status));
      const datos = Respuesta.parse(await respuesta.json());
      lista.append(...datos.items.map((item) => tarjeta(plantilla, item, bot, raiz)));
      siguiente = datos.siguiente;
      estado.hidden = lista.childElementCount > 0;
      if (!lista.childElementCount) estado.textContent = 'Todavía no hay verificaciones publicadas.';
      if (mas) mas.hidden = !paginar || siguiente === null;
    } catch {
      estado.hidden = false;
      estado.textContent = 'No se pudieron cargar las verificaciones. Intenta de nuevo en un rato.';
      if (mas) mas.hidden = true;
    }
  };

  mas?.addEventListener('click', () => {
    mas.disabled = true;
    void cargar(siguiente).finally(() => (mas.disabled = false));
  });
  await cargar();
}

document.querySelectorAll<HTMLElement>('[data-verificaciones]').forEach((raiz) => void iniciar(raiz));
