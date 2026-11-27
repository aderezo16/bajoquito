# Bajo Quito

Juego web sobre la gestión del metro de una ciudad inspirada en Quito. Esta es la base técnica en 3D.

## Cómo está hecho

- **Three.js** para el mundo 3D, **TypeScript** para el código y **Vite** para compilar.
- Cámara fija tipo maqueta (ortográfica) con arrastre, rebote en los bordes, inercia corta, zoom con rueda o pellizco y tres niveles de zoom.
- Las ventanas, los pins y la barra de estaciones son HTML encima del 3D.
- La profundidad (qué tapa a qué) la resuelve la tarjeta gráfica: nada se dibuja encima de lo que tiene delante.

## Carpetas

| Carpeta | Qué hay |
|---|---|
| `src/world/config.ts` | Trazado de la línea, estaciones, bandas de la ciudad, paleta |
| `src/models/` | **Registro de modelos**: cada elemento con sus versiones; el juego usa solo la *aprobada*, el catálogo muestra también la *en revisión* |
| `src/world/surface.ts` · `underground.ts` | Arman la superficie y el subsuelo del tramo |
| `src/world/life.ts` | Rutas de la gente: veredas, cruces con semáforo, bocas de estación, andenes |
| `src/engine/` | Cámara, multitudes (instancias), buses, trenes y semáforos |
| `src/ui/` | Pins y barra de estaciones |
| `src/catalog/` · `catalogo.html` | Catálogo de modelos: visor 3D, día/noche, persona de escala, comparar versiones |
| `tests/` | Pruebas automáticas |

## Cómo se aprueba un modelo

En `src/models/<archivo>.ts`, cada `register({...})` tiene `approved` (la que usa el juego) y, si hay una nueva en prueba, `review`.
Para aprobar: `approved: 'v2'` y quitar `review`. Las pruebas verifican que todas las versiones se construyan y respeten la escala.

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

## Estado

Prueba 3D del tramo Centro (Magdalena, San Francisco y Alameda), con superficie y bajo tierra.
Siguiente: catálogo de modelos, mapa completo de las 15 estaciones y traslado del juego (capítulos, decisiones y ventanas).
