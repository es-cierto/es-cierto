// Un mensaje de un hilo, en cualquier red. La memoria de una conversación es el hilo releído en cada turno.
export interface Turno {
  deBot: boolean;
  texto: string;
}
