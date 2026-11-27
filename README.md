# Bajo Quito

Juego web sobre la gestión del Metro de una ciudad inspirada en Quito. Personas e instituciones ficticias; mezcla datos públicos con supuestos marcados.

Dos páginas:

- **`index.html` — el juego.** Ciudad en 3D con las 15 estaciones (superficie y bajo tierra) y, encima, la interfaz y la lógica del juego: episodios, fichas de acción, ventanas de cada edificio, Concejo, Gallito, finanzas, bandeja, eventos, tutorial y final.
- **`catalogo.html` — el taller de modelos.** Para ajustar cada modelo 3D (controles, interruptores de partes y un chat que agrega o quita piezas) y guardar los ajustes.

## Cómo está hecho

- **Three.js** para la ciudad, **TypeScript** para el código 3D y **Vite** para compilar.
- La **lógica y las ventanas del juego** vienen del prototipo v0.9 y viven en `legacy/parts/*.js` (scripts que comparten un mismo ámbito). Vite los une en orden y los pone en la página del juego (`vite.config.ts`, plugin `legacy-game`).
- El juego y la ciudad hablan por `window.BQ3D` (`src/main.ts`):
  - el juego le dice a la ciudad qué pasó (`apply`): salud de los trenes, escaleras dañadas, fallas, publicidad, limpieza, apagones, repuestos en bodega, mantenimiento en el taller, protestas, escándalos, ánimo de cada zona, lluvia, frecuencia de trenes y buses;
  - la ciudad mueve los marcadores del juego sobre cada edificio y, al hacer clic en un edificio 3D, abre su ventana;
  - `focus` lleva la cámara al edificio de la ventana o del paso del tutorial; `setBuildings` y `rise` muestran los edificios que se abren en cada episodio.
- Cámara fija tipo maqueta (ortográfica) con arrastre, inercia, zoom con rueda o pellizco. La barra de la línea (abajo a la izquierda) lleva a cualquier estación.
- En el juego la geometría se arma con menos detalle (`Geo.lowDetail`); el taller usa el detalle completo. Si el equipo va lento, el juego baja la resolución sola.

## Carpetas

| Carpeta | Qué hay |
|---|---|
| `legacy/parts/` | Lógica e interfaz del juego (modelo económico, episodios, personajes, ventanas, flujo del mes, eventos, tutorial). `50_city3d.js` es el puente con la ciudad 3D |
| `legacy/game.css` | Estilos de la interfaz del juego |
| `src/main.ts` | La ciudad 3D y el puente `BQ3D` |
| `src/game/effects.ts` | Todo lo que en la ciudad responde al juego |
| `src/world/` | Trazado de la línea y barrios (`config.ts`), superficie, subsuelo, rutas de la gente |
| `src/models/` | **Registro de modelos**: cada elemento con sus versiones; el juego usa solo la *aprobada* |
| `src/models/approvals.ts` | Qué versión usa el juego y qué ajustes del taller se convirtieron en versión |
| `src/engine/` | Geometría, cámara, multitudes, buses, trenes, semáforos |
| `src/catalog/` | Taller de modelos y su chat |
| `tests/` | Pruebas automáticas |

## Cómo pasa un modelo del taller al juego

1. En el taller ajustas el modelo y aprietas «Guardar mis ajustes».
2. Le pides a Claude «pasa X al juego»: los ajustes guardados se convierten en una versión nueva en `src/models/approvals.ts` y se aprueban.
3. Pruebas, compilación y publicación.

## Comandos

```bash
npm install      # una vez
npm run dev      # abre el juego en el navegador con recarga automática
npm test         # pruebas
npm run build    # genera la carpeta dist/ para publicar
```

## Publicación

Cada cambio en la rama `main` se compila y se sube a Hostinger por FTP (`.github/workflows/deploy.yml`).
Hace falta configurar en GitHub los secretos `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` y la variable `FTP_DIR`.
