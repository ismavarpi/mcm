---
id: "SAS-DGSIC-GUARD-001"
title: "Guardrails para Requisitos Funcionales (FR): Spec + Examples"
owner:
  name: "Arquitectura y Producto DGSIC"
  role: "Gobernanza funcional"
status: "approved"                 # draft | approved | deprecated
version: "1.0.0"
applies_to:
  - "/funcional/FR-*.md"
  - "/docs/fr-index.md"
  - "/tests-map/fr-to-tests.json"
last_updated: "2025-08-12"
tags: ["governance", "spec-driven", "example-driven", "quality-gates"]
---

# Propósito
Asegurar que cada Requisito Funcional (FR) sea **único, trazable y verificable** mezclando **spec‑driven** (contratos, reglas y criterios de aceptación) con **example‑driven** (escenarios y tablas de decisión) y que la **CI** pueda validarlo de forma automática.

# Alcance
Aplica a todo documento FR bajo `/funcional`, al índice maestro `/docs/fr-index.md` y al mapa de pruebas `/tests-map/fr-to-tests.json`.

# Reglas operativas (normativas)
1. **Un FR por archivo** con **un único frontmatter** colocándolo en la primera línea del fichero. El contenido del FR **combina** la sección **Spec** (reglas, CA, pre/post) y la sección **Ejemplos** (Gherkin, tablas, límites).
2. **Identificadores únicos**: cada FR usa `FR-###` en `frontmatter.id` y en el nombre del archivo (ej.: `FR-001-reservar-quirófano.md`). Todos los enlaces internos deben ser **rutas relativas** resolubles.
3. **Ejemplos mínimos y de frontera**: cada FR debe incluir, como mínimo, **un caso feliz**, **invalidaciones típicas** y **límites temporales** (p. ej., ventanas de seguridad, expiraciones).
4. **Trazabilidad a pruebas**: el frontmatter de cada FR debe declarar `traceability.tests` con al menos **una prueba E2E o de contrato**. Los escenarios Gherkin del FR deben llevar `@tags` que aparezcan en `/tests-map/fr-to-tests.json`.
5. **Política de cambios**: cualquier modificación a una **Regla (R#)** o a un **Criterio de Aceptación (CA#)** obliga a **incrementar `version`** del FR y **re‑ejecutar** la(s) suite(s) vinculadas en `traceability.tests`.
6. **Índice maestro sincronizado**: todo FR debe estar listado en `/docs/fr-index.md` con su **ID, título, estado y prioridad**.
7. **Consistencia cruzada**: los `spec_links` de cada FR deben apuntar a specs existentes (API/Data/UX/Runbook). Los anclajes (`#get:/ruta`, `#Modelo`) deben resolver.

# Estructura mínima del frontmatter de un FR
Campos obligatorios y ejemplo mínimo.

```yaml
---
id: "FR-001"
title: "Reservar quirófano en bloque disponible"
status: "approved"         # draft | candidate | approved | deprecated
priority: "must"           # must | should | may
owner: "Producto DGSIC"
actors: ["Cirujano", "Gestor de quirófanos"]
spec_links:
  api:
    - "../specs/api/200-reservas.openapi.md#get:/reservas"
    - "../specs/api/200-reservas.openapi.md#post:/reservas"
  data:
    - "../specs/data/210-modelos-reserva.md#Reserva"
traceability:
  tests:
    - "e2e/reservas_e2e.spec.ts@crear_reserva_ok"
    - "contract/reservas.contract.ts@post_reservas_201"
last_updated: "2025-08-12"
---
