import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(DrawSVGPlugin);

const NS = 'http://www.w3.org/2000/svg';
const ALTO_NUDO = 28;
const FIBRAS = 4;
const ABRE = [-8, -2, 5, 11];
const LARGO = [16, 26, 20, 13];

interface Piezas {
  entrada: SVGPathElement;
  entre: SVGPathElement[];
  bajadas: SVGPathElement[];
  cola: SVGPathElement;
  fibras: SVGPathElement[];
  nudos: SVGCircleElement[];
}

function crear<K extends 'path' | 'circle'>(padre: SVGGElement, tipo: K) {
  const el = document.createElementNS(NS, tipo) as SVGElementTagNameMap[K];
  padre.append(el);
  return el;
}

function piezas(svg: SVGSVGElement, atadas: number): Piezas {
  const tramos = svg.querySelector<SVGGElement>('[data-tramos]')!;
  const nudos = svg.querySelector<SVGGElement>('[data-nudos]')!;
  tramos.replaceChildren();
  nudos.replaceChildren();
  return {
    entrada: crear(tramos, 'path'),
    entre: Array.from({ length: atadas - 1 }, () => crear(tramos, 'path')),
    bajadas: Array.from({ length: atadas }, () => crear(tramos, 'path')),
    cola: crear(tramos, 'path'),
    fibras: Array.from({ length: FIBRAS }, () => crear(tramos, 'path')),
    nudos: Array.from({ length: atadas }, () => {
      const c = crear(nudos, 'circle');
      c.setAttribute('r', '4.5');
      return c;
    }),
  };
}

function trazar(contenedor: HTMLElement, tarjetas: HTMLElement[], p: Piezas, horizontal: boolean) {
  const lista = tarjetas[0].offsetParent as HTMLElement;
  const caja = tarjetas.map((t) => ({
    x: lista.offsetLeft + t.offsetLeft,
    y: lista.offsetTop + t.offsetTop,
    w: t.offsetWidth,
    h: t.offsetHeight,
  }));
  const atadas = caja.slice(0, -1);
  const suelta = caja.at(-1)!;
  const r = (n: number) => n.toFixed(1);

  if (horizontal) {
    const nudos = atadas.map((c) => ({ x: c.x + c.w / 2, y: c.y - ALTO_NUDO }));
    const borde = -contenedor.getBoundingClientRect().left;
    const comba = 34;
    p.entrada.setAttribute(
      'd',
      `M${r(borde)} ${r(nudos[0].y - 40)} Q${r((borde + nudos[0].x) / 2)} ${r(nudos[0].y + comba)} ${r(nudos[0].x)} ${r(nudos[0].y)}`,
    );
    p.entre.forEach((tramo, i) => {
      const [a, b] = [nudos[i], nudos[i + 1]];
      tramo.setAttribute('d', `M${r(a.x)} ${r(a.y)} Q${r((a.x + b.x) / 2)} ${r(a.y + comba)} ${r(b.x)} ${r(b.y)}`);
    });
    nudos.forEach((n, i) => {
      p.bajadas[i].setAttribute('d', `M${r(n.x)} ${r(n.y)} L${r(n.x)} ${r(atadas[i].y)}`);
      p.nudos[i].setAttribute('cx', r(n.x));
      p.nudos[i].setAttribute('cy', r(n.y));
    });

    const ultimo = nudos.at(-1)!;
    const punta = { x: suelta.x + suelta.w * 0.22, y: ultimo.y - 4 };
    p.cola.setAttribute(
      'd',
      `M${r(ultimo.x)} ${r(ultimo.y)} Q${r((ultimo.x + punta.x) / 2)} ${r(ultimo.y + 26)} ${r(punta.x)} ${r(punta.y)}`,
    );
    p.fibras.forEach((f, i) => {
      f.setAttribute('d', `M${r(punta.x)} ${r(punta.y)} q${r(ABRE[i] * 0.2)} ${LARGO[i] * 0.5} ${ABRE[i]} ${LARGO[i]}`);
    });
  } else {
    const x = 12;
    const nudos = atadas.map((c) => ({ x, y: c.y + ALTO_NUDO }));
    p.entrada.setAttribute(
      'd',
      `M${x} -48 C${x + 14} ${r(nudos[0].y * 0.3)} ${x - 14} ${r(nudos[0].y * 0.7)} ${x} ${r(nudos[0].y)}`,
    );
    p.entre.forEach((tramo, i) => {
      const [a, b] = [nudos[i], nudos[i + 1]];
      const tercio = (b.y - a.y) / 3;
      const lado = i % 2 ? -12 : 12;
      tramo.setAttribute(
        'd',
        `M${x} ${r(a.y)} C${x + lado} ${r(a.y + tercio)} ${x - lado} ${r(b.y - tercio)} ${x} ${r(b.y)}`,
      );
    });
    nudos.forEach((n, i) => {
      p.bajadas[i].setAttribute('d', `M${x} ${r(n.y)} L${r(atadas[i].x)} ${r(n.y)}`);
      p.nudos[i].setAttribute('cx', String(x));
      p.nudos[i].setAttribute('cy', r(n.y));
    });
    const ultimo = nudos.at(-1)!;
    const punta = { x: x + 4, y: ultimo.y + (suelta.y + ALTO_NUDO - ultimo.y) * 0.55 };
    p.cola.setAttribute(
      'd',
      `M${x} ${r(ultimo.y)} C${x + 10} ${r(ultimo.y + 30)} ${x - 6} ${r(punta.y - 20)} ${r(punta.x)} ${r(punta.y)}`,
    );
    p.fibras.forEach((f, i) => {
      f.setAttribute('d', `M${r(punta.x)} ${r(punta.y)} q${r(ABRE[i] * 0.2)} ${LARGO[i] * 0.5} ${ABRE[i]} ${LARGO[i]}`);
    });
  }
}

export function iniciarTendedero(contenedor: HTMLElement) {
  const svg = contenedor.querySelector('svg')!;
  const tarjetas = [...contenedor.querySelectorAll<HTMLElement>('[data-tarjeta]')];
  const atadas = tarjetas.filter((t) => !t.hasAttribute('data-suelta'));
  const suelta = tarjetas.find((t) => t.hasAttribute('data-suelta'));
  if (!suelta || atadas.length < 2) return;

  const mm = gsap.matchMedia();
  mm.add({ siempre: 'all', ancho: '(min-width: 1024px)', reducir: '(prefers-reduced-motion: reduce)' }, (contexto) => {
    const { ancho, reducir } = contexto.conditions as { ancho: boolean; reducir: boolean };
    const p = piezas(svg, atadas.length);
    const dibujar = () => trazar(contenedor, tarjetas, p, ancho);
    dibujar();
    if (reducir) return;

    gsap.set([p.entrada, ...p.entre, ...p.bajadas, p.cola, ...p.fibras], { drawSVG: '0%' });
    gsap.set(p.nudos, { scale: 0, transformOrigin: '50% 50%' });
    gsap.set(p.fibras, { strokeWidth: 1.25 });

    const colgar = ancho ? { rotation: -7, y: -14 } : { x: -14 };
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: contenedor,
        start: 'top 82%',

        end: ancho ? 'bottom 60%' : 'bottom 92%',
        scrub: 0.6,
        invalidateOnRefresh: true,
        onRefreshInit: dibujar,
      },
      defaults: { ease: 'none' },
    });
    tl.fromTo(p.entrada, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1 });
    atadas.forEach((tarjeta, i) => {
      tl.fromTo(p.nudos[i], { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.15, ease: 'back.out(3)' })
        .fromTo(p.bajadas[i], { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.15 }, '<')
        .from(tarjeta, { ...colgar, autoAlpha: 0, duration: 0.6, ease: 'back.out(1.6)' }, '<0.05');
      if (p.entre[i]) tl.fromTo(p.entre[i], { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.8 }, '<0.1');
    });
    tl.fromTo(p.cola, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.5 })
      .fromTo(p.fibras, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.25, stagger: 0.06 })

      .from(suelta, { autoAlpha: 0, y: -40, duration: 0.6, ease: 'bounce.out' }, '<');
  });
}
