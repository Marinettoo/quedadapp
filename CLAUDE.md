# Peña de fútbol — instrucciones para Claude Code

Lee y sigue estos documentos antes de proponer o modificar la aplicación:

- @docs/producto.md — alcance, funciones y reglas confirmadas.
- @docs/diseno.md — dirección visual y referencia Moonli.
- @docs/decisiones-pendientes.md — preguntas que requieren decisión del usuario.
- @docs/publicacion.md — requisitos para desplegar en un servidor.

## Forma de trabajar

- Comunícate en español claro. Explica brevemente términos técnicos nuevos.
- Antes de programar, inspecciona el repositorio y resume qué hay y qué falta.
- No asumas una tecnología ni generes una aplicación completa hasta acordar arquitectura y primer alcance.
- Distingue requisitos confirmados, propuestas y decisiones pendientes. No inventes reglas de negocio.
- Trabaja en incrementos pequeños. Antes de cambios amplios, explica el alcance.
- No afirmes haber ejecutado comprobaciones o desplegado algo si no lo hiciste. Al terminar un cambio, resume archivos, decisiones y comprobaciones realizadas.
- No guardes secretos, contraseñas, claves de API ni credenciales en archivos del repositorio.
- No proceses pagos ni añadas una función de apuestas con dinero real sin autorización y definición expresa del usuario.
- Mantén el diseño de `docs/diseno.md` y construye una identidad propia para la peña; no copies marcas ni recursos exclusivos de la referencia.

## Primer paso en un repositorio vacío

Lee los documentos importados y conversa con el usuario para resolver primero las decisiones de `docs/decisiones-pendientes.md`. Luego recomienda una arquitectura sencilla, segura y asequible, explicando sus costes recurrentes y mantenimiento. No inicialices el stack ni crees archivos de aplicación hasta que el usuario elija la propuesta.
