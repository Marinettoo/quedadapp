# Producto — webapp de la peña

## Objetivo

Aplicación privada para organizar partidos de fútbol de una peña: asistencia, votaciones, equipos, reserva y pagos, valoraciones, resultados e historial. Se usará sobre todo desde móvil y se alojará en un servidor.

## Funciones previstas

- Cuentas con nombre de usuario y contraseña. Cada registro queda pendiente hasta aprobación de un administrador.
- Roles iniciales: administrador y usuario común. Una persona encargada de una reserva puede ser de cualquiera de los dos roles y recibe permisos limitados para ese partido.
- Crear partidos con fecha, hora, ubicación, formato, asistencia, persona encargada, estado de reserva y, cuando se defina, importe y fecha límite.
- Apuntarse y cancelar asistencia hasta el plazo que se defina.
- Votar posibles fechas y horas, y crear otras votaciones configurables.
- Registrar pagos de la reserva del campo.
- Generar equipos equilibrados usando los asistentes confirmados y sus valoraciones con estrellas.
- Guardar resultados e historial de partidos.
- Posible función de pronósticos/apuestas, pendiente de definir. No asumir dinero real.

## Acceso y aprobación

- Registro con usuario y contraseña; no se conoce todavía si también se pedirá correo.
- Las nuevas cuentas no acceden a las funciones privadas hasta que un administrador aprueba la solicitud.
- Los administradores pueden revisar, aprobar o rechazar solicitudes.
- Incluir cierre de sesión y recuperación segura de contraseña. Definir el método después de decidir si se usará correo u otro mecanismo.
- Los permisos se deben validar en el servidor, no solo ocultar controles en la interfaz.

## Modos de partido y equipos

1. **Triangular:** tres equipos.
2. **2 equipos:** dos equipos de 7 u 8 jugadores, según la asistencia.

El generador:

- Solo usa jugadores apuntados al partido.
- Usa las estrellas como indicador para intentar equilibrar el nivel total de los equipos.
- Busca tamaños parecidos cuando las reglas del modo lo permitan.
- Informa si la cantidad de asistentes no encaja con el formato; no añade ni excluye jugadores silenciosamente.
- Permite ajustes manuales con permisos que todavía hay que definir.
- Muestra la lista y el total de asistentes antes de generar.
- Avisa si cambian los asistentes después de generar y permite regenerar.

Hay que definir qué hacer en triangulares si el total no se divide por tres y en el modo de dos equipos si no hay 14 o 16 jugadores. No dar por hecho cómo tratar suplentes, equipos de distinto tamaño o límite de asistencia.

## Valoraciones

- Los jugadores se valoran con estrellas.
- Número de estrellas, quién puede valorar, frecuencia, visibilidad y posibilidad de editar valoraciones están pendientes.
- Las estrellas sirven como criterio aproximado para equilibrar equipos, no como medida objetiva de la capacidad de una persona.

## Reserva y pagos

- La persona encargada de reservar se asigna por partido y puede cambiar. Puede ser administrador o usuario común.
- Todos los jugadores que participen deben pagar la parte que les corresponda de la reserva.
- Cada jugador puede indicar que ya ha pagado. Esa indicación queda pendiente; no confirma el pago automáticamente.
- La persona encargada de la reserva revisa y confirma cada pago, aunque sea usuario común.
- Mostrar estados: pendiente de indicar; indicado como pagado, pendiente de confirmación; confirmado.
- La persona encargada puede corregir una confirmación errónea. Los administradores pueden resolver incidencias.
- Registrar quién indicó el pago, quién lo confirmó y cuándo, además de cambios relevantes.
- La app llevará el registro de avisos y confirmaciones; no procesará pagos ni guardará datos bancarios salvo petición expresa.
- Importe, división del coste, plazo y consecuencias de impago están pendientes.

## Votaciones

Cada votación deberá poder definir pregunta, opciones, participantes, fecha de cierre y si los votos son públicos o secretos. También falta decidir cómo resolver empates y quién puede crear/cerrar votaciones.

## Resultados e historial

- Cada resultado corresponde a un partido concreto.
- Está pendiente definir quién puede introducir y corregir resultados.
- Conservar historial de partidos, equipos y resultados, evitando cambios accidentales sin trazabilidad.

## Apuestas o pronósticos

Alcance pendiente. Antes de diseñarlo, preguntar si son pronósticos informales o si incluyen dinero, premios o saldos. No implementar cobros, pagos ni dinero real sin definición y autorización explícitas.

## Principios de producto

- Diseño móvil primero, interfaz clara para personas con distintos niveles de experiencia.
- Hacer visibles acciones como apuntarse, votar, consultar equipos y confirmar pagos.
- Mostrar estados, plazos y errores con claridad; incluir estados vacíos útiles.
- No revelar votaciones secretas antes del cierre.
- No conectar servicios externos de reserva ni asumir un proveedor de campos.
