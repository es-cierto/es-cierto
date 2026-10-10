import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { SplitText } from 'gsap/SplitText';
import { iniciarRecorrido } from './recorrido';
import { iniciarTendedero } from './tendedero';

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, SplitText);

const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Scroll suave sincronizado con ScrollTrigger. Con movimiento reducido, el scroll nativo.
if (!reducir) {
  const lenis = new Lenis({ autoRaf: false, anchors: true });
  lenis.on('scroll', () => ScrollTrigger.update());
  gsap.ticker.add((tiempo) => lenis.raf(tiempo * 1000));
  gsap.ticker.lagSmoothing(0);
}

// Entradas al hacer scroll: IntersectionObserver, nunca un listener de scroll.
const observador = new IntersectionObserver(
  (entradas) => {
    for (const entrada of entradas) {
      if (!entrada.isIntersecting) continue;
      entrada.target.classList.add('visible');
      observador.unobserve(entrada.target);
    }
  },
  { rootMargin: '0px 0px -10% 0px' },
);
document.querySelectorAll('[data-revelar]').forEach((el) => observador.observe(el));

const recorrido = document.querySelector<HTMLElement>('[data-recorrido]');
if (recorrido) iniciarRecorrido(recorrido, reducir);

const tendedero = document.querySelector<HTMLElement>('[data-tendedero]');
if (tendedero) iniciarTendedero(tendedero);

// Titulares: cada línea sube desde abajo de su propia máscara. autoSplit vuelve a partir las líneas si cambia el ancho
// o termina de cargar la fuente. SplitText deja el texto completo en aria-label para los lectores de pantalla.
if (!reducir) {
  document.querySelectorAll<HTMLElement>('[data-titular]').forEach((titular) => {
    let entrada: gsap.core.Tween | undefined;
    SplitText.create(titular, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'linea',
      autoSplit: true,
      // Al volver a partir (otro ancho, fuente cargada), la entrada anterior se descarta.
      onSplit: (partes) => {
        entrada?.revert();
        entrada = gsap.from(partes.lines, {
          yPercent: 110,
          duration: 1.1,
          stagger: 0.09,
          ease: 'expo.out',
          scrollTrigger: { trigger: titular, start: 'top 88%', once: true },
        });
      },
    });
  });
}

// Lema: cada palabra pasa del tono apagado al pleno, en orden de lectura.
document.querySelectorAll<HTMLElement>('[data-palabras]').forEach((bloque) => {
  const palabras = [...bloque.querySelectorAll<HTMLElement>('[data-palabra]')];
  if (reducir) {
    palabras.forEach((p) => p.classList.add('encendida'));
    return;
  }
  ScrollTrigger.create({
    trigger: bloque,
    start: 'top 80%',
    end: 'bottom 45%',
    onUpdate: (self) => {
      const encendidas = Math.round(self.progress * palabras.length);
      palabras.forEach((p, i) => p.classList.toggle('encendida', i < encendidas));
    },
  });
  // El hilo de abajo se tensa mientras se encienden las palabras y se corta con la última.
  const [izquierda, derecha] = bloque.querySelectorAll<SVGPathElement>('[data-mitad]');
  if (!izquierda || !derecha) return;
  gsap
    .timeline({ scrollTrigger: { trigger: bloque, start: 'top 80%', end: 'bottom 40%', scrub: 0.5 } })
    .fromTo([izquierda, derecha], { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.8, ease: 'none', stagger: 0.25 })
    .to(izquierda, { x: -10, y: 3, rotation: -1.5, transformOrigin: '0% 50%', duration: 0.2, ease: 'power2.out' })
    .to(derecha, { x: 14, y: 12, rotation: 4, transformOrigin: '100% 50%', duration: 0.2, ease: 'power2.out' }, '<');
});

// "Nada atado": el hilo suelto baja apenas mientras se lee, como si colgara.
if (!reducir) {
  gsap.utils.toArray<HTMLElement>('[data-colgar]').forEach((imagen) => {
    gsap.fromTo(
      imagen,
      { yPercent: -6 },
      {
        yPercent: 4,
        ease: 'none',
        scrollTrigger: { trigger: imagen, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });
}
