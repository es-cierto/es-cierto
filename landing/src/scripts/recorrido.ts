import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ordenDeCarga, paradaActual, posicion, tramo } from './tramos';

// El recorrido del hilo: el scroll avanza los clips entre parada y parada. Debajo de los clips están las imágenes de
// cada parada (cuadros reales del video), que se ven mientras un clip no ha cargado y siempre con movimiento reducido o
// ahorro de datos.
export function iniciarRecorrido(seccion: HTMLElement, reducir: boolean) {
  const escenario = seccion.querySelector<HTMLElement>('[data-escenario]');
  if (!escenario) return;
  const paradas = [...seccion.querySelectorAll<HTMLElement>('[data-parada]')];
  const cuadros = [...escenario.querySelectorAll<HTMLElement>('[data-cuadro]')];
  const clips = [...escenario.querySelectorAll<HTMLVideoElement>('[data-clip]')];
  const enlaces = [...escenario.querySelectorAll<HTMLAnchorElement>('[data-ir]')];
  const riel = escenario.querySelector<HTMLElement>('[data-riel]');
  const pista = escenario.querySelector<HTMLElement>('[data-pista]');
  const focos = paradas.map((p) => Number(p.dataset.foco ?? 50));
  const ultima = paradas.length - 1;

  const marcas = paradas.map((p) => ScrollTrigger.create({ trigger: p, start: 'top top' }));
  const listo = clips.map(() => false);
  let actual = -1;
  let w = 0;
  let activo = -1;
  let segundo = 0;

  const marcarParada = (indice: number) => {
    if (indice === actual) return;
    actual = indice;
    paradas.forEach((p, i) => p.classList.toggle('actual', i === indice));
    enlaces.forEach((a, i) => a.setAttribute('aria-current', String(i === indice)));
  };

  // El clip se muestra recién cuando llegó al cuadro pedido; si no, siguen las imágenes.
  const sincronizar = () => {
    const clip = clips[activo];
    if (!clip || !listo[activo]) {
      delete escenario.dataset.modo;
      clips.forEach((c) => c.classList.remove('visible'));
      return;
    }
    if (clip.seeking) return;
    if (Math.abs(clip.currentTime - segundo) > 0.01) {
      clip.currentTime = segundo;
      return;
    }
    clips.forEach((c, i) => c.classList.toggle('visible', i === activo));
    escenario.dataset.modo = 'video';
  };
  clips.forEach((clip, i) => clip.addEventListener('seeked', () => i === activo && sincronizar()));

  const pintar = (self: ScrollTrigger) => {
    w = posicion(
      self.scroll(),
      marcas.map((m) => m.start),
      self.end,
    );
    marcarParada(paradaActual(w));

    // Foco del recorte en pantallas verticales, interpolado entre paradas.
    const i = Math.min(Math.floor(w), ultima);
    const f = focos[i] + (focos[Math.min(i + 1, ultima)] - focos[i]) * (w - i);
    escenario.style.setProperty('--foco', `${f}%`);
    if (riel) riel.style.transform = `scaleY(${w / ultima})`;
    if (pista) pista.style.opacity = String(Math.max(0, 1 - w * 4));

    // Imágenes: la de la parada de origen entera; la de destino aparece a medida que avanza el tramo.
    cuadros.forEach((cuadro, k) => {
      const opacidad = k === i ? 1 : k === i + 1 ? w - i : 0;
      cuadro.style.opacity = String(opacidad);
      if (!reducir) cuadro.style.transform = `scale(${1 + 0.04 * Math.max(0, Math.min(1, w - k))})`;
    });

    const t = tramo(w, clips.length);
    activo = t ? t.clip : -1;
    if (t && listo[t.clip]) segundo = Math.min(t.avance * clips[t.clip].duration, clips[t.clip].duration - 0.05);
    sincronizar();
  };

  const recorrido = ScrollTrigger.create({
    trigger: seccion,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: pintar,
    onRefresh: pintar,
  });
  pintar(recorrido);

  const conexion = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (!clips.length || reducir || conexion?.saveData) return;

  const movil = matchMedia('(max-width: 860px), (pointer: coarse)').matches;
  const webm = clips[0].canPlayType('video/webm; codecs="vp9"') !== '';
  const fuente = (clip: HTMLVideoElement) =>
    (movil ? clip.dataset.movil : webm ? clip.dataset.webm : clip.dataset.mp4) ?? '';

  let pendientes = clips.map((_, i) => i);
  const cargarSiguiente = async () => {
    const [i, ...resto] = ordenDeCarga(pendientes, w);
    if (i === undefined) return;
    pendientes = resto;
    const clip = clips[i];
    const url = fuente(clip);
    clip.preload = 'auto';
    // Cada clip se baja entero para que avanzar con el scroll no dependa de la red.
    try {
      const respuesta = await fetch(url);
      if (!respuesta.ok) throw new Error(String(respuesta.status));
      clip.src = URL.createObjectURL(await respuesta.blob());
    } catch {
      clip.src = url;
    }
    const cargado = await new Promise<boolean>((resolver) => {
      clip.addEventListener('loadeddata', () => resolver(true), { once: true });
      clip.addEventListener('error', () => resolver(false), { once: true });
    });
    if (cargado) {
      // iOS no pinta los cuadros buscados hasta que el video se reprodujo una vez.
      await clip.play().catch(() => {});
      clip.pause();
      listo[i] = true;
      pintar(recorrido);
    }
    void cargarSiguiente();
  };

  if (document.readyState === 'complete') void cargarSiguiente();
  else addEventListener('load', () => void cargarSiguiente(), { once: true });
}
