import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { iniciarRecorrido } from './recorrido';

gsap.registerPlugin(ScrollTrigger);

const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Scroll suave sincronizado con ScrollTrigger. Con movimiento reducido, el scroll nativo.
if (!reducir) {
  const lenis = new Lenis({ autoRaf: false, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
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
});

// "Nada atado": el hilo suelto baja apenas mientras se lee, como si colgara.
if (!reducir) {
  gsap.utils.toArray<HTMLElement>('[data-colgar]').forEach((imagen) => {
    gsap.fromTo(imagen, { yPercent: -6 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: imagen, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}
