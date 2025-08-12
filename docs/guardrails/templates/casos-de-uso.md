---
id: "UC-01-<slug>"
title: "<título breve y claro>"
domain: "<dominio-slug>"
entities: ["<entidad1>", "<entidad2>"]
status: "proposed"
jira_keys: ["SAS-1234"]
related_enhancement: "ENH-YYYY-####-<slug>"     # opcional
version: "1.0"
owner: "Nombre y rol (PO/Analista)"
last_updated: "2025-08-12"
ai_summary: "Resumen de 1-2 líneas orientado a IA (qué resuelve, para quién)."
ai_tags: ["use-case","spec-driven","example-coding"]
---

## Objetivo y contexto
Explica en 3–5 frases qué problema resuelve este caso de uso, para qué perfil y con qué límite de alcance. Si aplica, señala dependencias evidentes con otros procesos o sistemas.

## Alcance (in/out)
- **Incluye:** funcionalidades específicas que sí se esperan en este CU.
- **Excluye:** lo que explícitamente no entra para evitar ambigüedad.

## Actores
- **Primarios:** quién ejecuta la acción principal (p. ej., Paciente).
- **Secundarios/Sistemas:** motores, integraciones, servicios implicados.

## Supuestos / Precondiciones
- Requisitos previos verificables para iniciar el flujo (sesión iniciada, permisos, datos mínimos).

## Flujo principal
1. Paso a paso en modo usuario-sistema, claro y secuencial.
2. Cada paso debe ser verificable (entradas, salidas observables).

## Flujos alternativos
- **A1 – <condición>**: describe la variante y el comportamiento esperado.
- **A2 – <condición>**: idem.

## Reglas de negocio
- Regla R1: …
- Regla R2: …

## Datos y validaciones (alto nivel)
- Campos clave tocados por el flujo (IDs, fechas, estados) y validaciones críticas.

## Criterios de aceptación (CA)
- **CA-01**: condición observable y binaria para dar por válido el CU.
- **CA-02**: …
- **CA-03**: …

---

# Ejemplos (example-driven dentro del mismo MD)

> Los copilotos aprenden rápido con ejemplos claros. Mantén este formato.

### Ejemplo 2 — path alternativo (vincula a CA-01, CA-03)
**Input (contexto):**
```json
{
  "patient_id": "P-9981",
  "preferences": { "center_id": "C-045" },
  "history": { "last_specialties": ["MED-FAM"] }
}

**Acción del usuario:**

1) Abre "Cita rápida"
2) Acepta propuesta de especialidad/centro
3) Selecciona primer hueco disponible

**Respuesta esperada (salida del sistema):*
{
  "appointment_id": "A-55021",
  "center_id": "C-045",
  "start": "2025-09-03T10:30:00Z",
  "status": "confirmed",
  "summary": "Cita confirmada"
}

**Notas:**
- Debe cumplir R1 (priorizar centro preferido) y R2 (mostrar 3 huecos).
- Traza con CA-01, CA-03.


### Ejemplo 1 — Happy path (vincula a CA-01, CA-03)
**Input (contexto):**
```json
{
  "patient_id": "P-9981",
  "preferences": { "center_id": "C-045" },
  "history": { "last_specialties": ["MED-FAM"] }
}

**Acción del usuario:**

1) Abre "Cita rápida"
2) Acepta propuesta de especialidad/centro
3) Selecciona primer hueco disponible

**Respuesta esperada (salida del sistema):*
{
  "appointment_id": "A-55021",
  "center_id": "C-045",
  "start": "2025-09-03T10:30:00Z",
  "status": "confirmed",
  "summary": "Cita confirmada"
}

**Notas:**
- Debe cumplir R1 (priorizar centro preferido) y R2 (mostrar 3 huecos).
- Traza con CA-01, CA-03.

