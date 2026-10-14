# Consultas: estado al aplazar

Fecha: 2026-10-14 · Rama: `rhenao-sprint04` (front) y `rhenao_sprint04` (back)
Plan completo: [plan-consultas.md](plan-consultas.md) (2026-09-29, backend revisado en `e94252c`).

**Estado: aplazado** por decisión del usuario el 2026-10-14. Antes de esto se van a hacer cambios en *Cargue de archivos*, que salen de las pruebas con datos reales del cliente. No hay código escrito: `src/features/queries/` sigue vacía y el backend no tiene `ConsultasController`.

## 1. Qué se acordó

El 2026-09-29 el usuario pidió analizar el menú *Consultas*, que solo tiene *Lotes de carga*, y aceptó esta lista de 5 consultas nuevas:

| # | Consulta | Para qué sirve |
|---|---|---|
| 1 | Historial de transmisiones | Saber qué se envió a la SFC, cuándo y qué respondió. Casi no necesita backend: `GET /api/transmisiones` ya lista todas las transmisiones. |
| 2 | Resumen de cartera por corte | Cuadrar el corte antes de transmitir. Toma la capa final y agrega en SQL por universalidad, calificación, rango de mora y estado. |
| 3 | Estado de cumplimiento por corte | Ver qué falta para cerrar cada mes, en una matriz de cortes por universalidades que marca las faltantes. |
| 4 | Ficha de crédito | Ver un crédito o deudor y su historia mes a mes. Como muestra datos personales, lleva permiso propio y auditoría y no se exporta. |
| 5 | Comparación entre cortes | Detectar créditos nuevos, desaparecidos, terminados, con variación de saldo o con salto de mora. |

**Motivo:** hoy no hay forma de ver el contenido de lo que se transmite ni de cuadrar un corte antes de enviarlo.

## 2. Fases (≈6,5 días)

| Fase | Contenido | Estimado |
|---|---|---|
| K0 (F) | Base: feature `queries`, servicio, menú, rutas y helper de exportación a Excel (`xlsx` ya está instalado). | ≈0,5 día |
| K1 | Historial de transmisiones: filtros en `GET /api/transmisiones` y pantalla. | ≈0,5 día |
| K2 | Resumen de cartera: `ConsultasController`, `/cortes` y `/cartera`. | ≈1 día |
| K3 | Cumplimiento por corte: `/cumplimiento` y la matriz. | ≈1 día |
| K4 | Ficha de crédito: permiso nuevo, búsqueda, detalle y auditoría. | ≈1,5 días |
| K5 | Comparación entre cortes: `/comparacion`. | ≈1,5 días |
| K6 | Cierre: `CLAUDE.md` de los dos repos y guía de pruebas manuales. | ≈0,5 día |

## 3. Decisiones pendientes (sin responder)

Al retomar, lo primero es que el usuario responda estas decisiones. Cada una trae mi recomendación; el detalle está en el §7 del plan.

| # | Pregunta | Recomendación |
|---|---|---|
| K1 | Orden de las fases | Transmisiones, cartera, cumplimiento, ficha y comparación. |
| K2 | Quién ve la ficha de crédito | Permiso nuevo `consultas.creditos`, asignado a ADMIN y OPERADOR. |
| K3 | ¿Se audita la ficha? | Sí: la búsqueda y el detalle. |
| K4 | ¿Se enmascara la identificación del deudor? | No. La protegen el permiso y la auditoría. |
| K5 | Qué se exporta a Excel | Todo menos la ficha de crédito. |
| K6 | Rangos de mora | 0, 1–30, 31–60, 61–90, 91–180, 181–360 y más de 360 días. |
| K7 | Estados terminales | 5, 6, 8, 9 y 10. El 4 (Titularizada) no. |
| K8 | Umbral de variación de saldo | +20 % / −50 % del capital, configurable. |
| K9 | Desde cuándo falta una universalidad en un corte | Desde su primer lote no anulado, y solo mientras esté activa. |
| K10 | ¿Gráficos? | No en la primera versión. |
| K11 | ¿El resumen usa solo lo promovido? | Sí. |

## 4. Al retomar

1. Revisar el plan contra el backend de ese momento. Fue escrito sobre `e94252c`, y los cambios de *Cargue de archivos* que vienen pueden cambiar los datos de la capa final o las universalidades.
2. Revisar los datos de prueba del §4 y §5 del plan (cortes 2026-11-30, 2027-01-31 y 2027-02-28, `PRB-301`). La base local se reconstruyó el 2026-10-07 y es posible que ya no estén.
3. Pedir las respuestas K1–K11, incorporarlas al plan y avanzar una fase por turno, con un commit por fase y por repo.
