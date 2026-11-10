# CLAUDE.md — Panel operativo de incidencias

Especificación ejecutable de la prueba técnica. Este fichero es la **única fuente de verdad**: contiene los requisitos literales del enunciado, las decisiones ya tomadas y las instrucciones de implementación para backend y frontend. No hace falta volver al PDF.

---

## 1. Contexto y reglas de la prueba

**Aplicación a construir:** `Panel operativo de incidencias`.

Duración estimada del enunciado: 90 minutos. Entrega: repositorio de GitHub con instrucciones claras de ejecución. La prueba no parte de un repositorio preparado: hay que crear el proyecto, organizarlo y dejar instrucciones suficientes para ejecutarlo.

**No se busca una aplicación grande.** Se busca una solución pequeña, coherente, mantenible y razonada. Para perfil mid/senior se valora especialmente el **criterio**:

- Transacciones
- Validaciones
- Relaciones
- Trazabilidad
- Claridad ante errores de datos

> La diferencia a este nivel está en el criterio técnico, no en la cantidad de pantallas.

### 1.1 Desviación de stack (autorizada)

El enunciado exige **PHP + Laravel + MySQL**. Tras conversarlo con la compañía, se autoriza resolver la prueba con:

| Enunciado | Implementación real |
| --- | --- |
| PHP + Laravel | **NestJS** + TypeScript |
| MySQL | **PostgreSQL 16** (vía Docker) |
| Blade/Livewire o Inertia + React | **React 19 + Vite** (SPA que consume la API REST) |
| Bootstrap o Tailwind | **Tailwind v4 + shadcn/ui** |
| JavaScript para interacción | TypeScript + TanStack Query |

Motivo documentado en el README: comodidad y dominio del stack; PostgreSQL en Docker evita configurar nada en la máquina que levante el proyecto. Las restricciones que **sí se respetan**: HTML/CSS propios, Tailwind como apoyo visual, interacción real en el cliente y **no usar Next.js**.

### 1.2 Equivalencias Laravel → NestJS

Cuando el enunciado pida un artefacto de Laravel, se implementa su equivalente:

| Laravel | Aquí |
| --- | --- |
| Migraciones Artisan | Migraciones TypeORM (`src/migrations/`) |
| Seeders | `yarn seed` (`src/seed/`) |
| Eloquent | TypeORM `Repository` + `QueryBuilder` |
| FormRequest / `$request->validate()` | DTO + `class-validator` + `ValidationPipe` global |
| Enum / constantes de modelo | Enums TS centralizados (`src/incidents/enums/`) |
| `DB::transaction()` | `dataSource.transaction()` |
| Comando Artisan de diagnóstico | **Endpoints de mantenimiento** (decisión tomada, ver §8) |
| Blade / Inertia | React + react-router 7 |

---

## 2. Stack real, comandos y arranque

### Backend (`/backend`) — gestor: **yarn**

NestJS 10 · TypeScript 5.9 · TypeORM 0.3 · `pg` · `@nestjs/swagger` 11 · `class-validator` / `class-transformer` · Jest 29.

### Frontend (`/frontend`) — gestor: **npm**

React 19 · Vite 8 · react-router **7** (paquete `react-router`, no `react-router-dom`) · TanStack Query 5 · axios · **Tailwind v4** (sin `tailwind.config.js`; plugin `@tailwindcss/vite` y `@import 'tailwindcss'` en `src/index.css`) · shadcn/ui · lucide-react · Vitest 4 + Testing Library.

> No mezclar gestores: `yarn` en backend, `npm` en frontend.

### Comandos

```bash
# 1. Base de datos
docker compose up -d

# 2. Backend
cd backend
yarn install
yarn migration:run      # crea el esquema
yarn seed               # datos de ejemplo (incluye las inconsistencias del Ejercicio 5)
yarn start:dev          # http://localhost:3000/api  ·  Swagger en /api/docs

# 3. Frontend
cd frontend
npm install
npm run dev             # http://localhost:5173

# Tests
cd backend && yarn test
cd frontend && npm test
```

---

## 3. Deuda previa a limpiar antes de implementar

El repositorio contiene un proyecto **anterior y distinto** (API de noticias con enriquecimiento LLM y búsqueda booleana). Ese dominio se **elimina**; se conserva el andamiaje y las convenciones.

### Backend — borrar

- `src/articles/`, `src/search/`, `src/analytics/`, `src/llm/`
- `src/seed/sample_articles.json` y el enriquecimiento del seed
- `test/app.e2e-spec.ts` (boilerplate de Nest que pide `GET /` esperando `Hello World!`: falla porque hay prefijo global `api` y no existe `AppController`)
- Dependencias sin uso: `@anthropic-ai/sdk`, `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`, `joi`, `@nestjs/mapped-types`, `uuid`
- Variables de entorno huérfanas: `JWT_SECRET`, `ANTHROPIC_API_KEY`, `LLM_MODEL`, `LLM_MAX_BODY_CHARS`

### Backend — conservar y reutilizar

- `src/main.ts` (prefijo global, CORS, `ValidationPipe`, Swagger)
- `src/config/app.config.ts`
- `src/common/dtos/pagination.dto.ts` y `paginated-response.dto.ts`
- `src/common/services/exception-handler.service.ts` (ver §6.5)
- `src/health/` tal cual

### Frontend — borrar

- `src/actions/*article*`, `src/hooks/use*Article*`, `src/interfaces/{analytics,article}.interface.ts`
- `src/pages/{SearchPage,AnalyticsPage,ArticlePage}.tsx`
- `src/lib/sentiment.ts`, `src/lib/sleep.ts`
- `coverage/` (artefacto commiteado de otro proyecto) → añadir `coverage/` a `.gitignore`

### Frontend — corregir

- `index.html`: el `<title>` es `Teslo | Shop` y hay un `preconnect` a Montserrat heredado de una plantilla
- `components.json` declara `iconLibrary: "phosphor"` pero todo el código usa `lucide-react` → **fijarlo a lucide antes de añadir componentes con el CLI de shadcn**
- Declarar `@radix-ui/react-slot` en `package.json` (hoy se usa en `ui/button.tsx` por hoisting transitivo de npm)
- Montar `ReactQueryDevtools` (instalado, no montado) o retirarlo
- Retirar deps sin uso: `react-hook-form` (salvo que se use en el formulario de creación), `zustand`, `@phosphor-icons/react`, el toolchain del React Compiler (`@babel/core`, `@rolldown/plugin-babel`, `babel-plugin-react-compiler`) que no está activado en `vite.config.ts`
- `.env.test` apunta a `http://localhost:3001` sin el prefijo `/api` → alinear o eliminar

### Entorno — desajuste crítico a resolver

| Fichero | Usuario | Base de datos |
| --- | --- | --- |
| `.env.template` (raíz, alimenta docker-compose) | `DB_USER` | `optima_retail_db` |
| `backend/.env.template` | `DB_USERNAME` | `media_signal_db` |

Tal cual, **el backend apunta a una base de datos que el contenedor no crea**. Unificar a `DB_USERNAME` y `DB_NAME=optima_retail_db` en `docker-compose.yaml`, en el `.env.template` de la raíz y en `backend/.env.template`. Añadir además un **`.env.example` sin credenciales reales** en la raíz (lo exige el apartado de entrega del enunciado).

---

## 4. Ejercicio 1 — Maquetación de la pantalla principal

Pantalla principal para **consultar y operar** incidencias. Checklist literal:

- [ ] Cabecera con el nombre de la aplicación y una **breve descripción funcional**
- [ ] Listado de incidencias en tabla o tarjetas, con **prioridad, estado, fecha y responsable o solicitante**
- [ ] **Indicadores visuales claros** para los estados: abierta, en revisión, bloqueada, resuelta
- [ ] Formulario para crear una nueva incidencia
- [ ] **Acción visible** para cambiar el estado de una incidencia
- [ ] Acceso al **historial de cambios** de una incidencia
- [ ] Diseño limpio, responsive y usable en escritorio y móvil

> Para un perfil mid/senior no basta con que la pantalla se vea correcta: debe ser fácil de entender, mantener y ampliar. **Evitar CSS caótico, componentes gigantes y markup innecesariamente acoplado.**

### Implementación

- Tabla (`<Table>`) en `md+`, tarjetas (`<Card>`) en móvil. Un solo origen de datos, dos presentaciones.
- Un componente por responsabilidad, ninguno por encima de ~150 líneas:
  `AppHeader`, `IncidentFilters`, `StatusCounters`, `IncidentsTable`, `IncidentCardList`, `StatusBadge`, `PriorityBadge`, `NewIncidentDialog`, `ChangeStatusDialog`, `ActivityTimeline`, `CommentForm`.
- Indicadores de estado **centralizados** en un único mapa estado → variante/color/etiqueta (`src/lib/incident-ui.ts`), consumido por `StatusBadge`. Ningún color de estado escrito a mano en una página.
- Sin CSS a medida salvo lo imprescindible: clases de Tailwind y tokens del tema ya definidos en `src/index.css`.

### Componentes shadcn a añadir

Hoy solo existen `badge`, `button` e `input` en `src/components/ui/`. Añadir: `table`, `card`, `select`, `dialog`, `alert-dialog`, `textarea`, `label`, `tabs`, `separator`, `skeleton`, `sonner`.

---

## 5. Ejercicio 2 — Base de datos y modelo de datos

Migraciones necesarias para trabajar, **como mínimo**, con estas tres entidades. Los campos mínimos son los del enunciado; los campos extra están justificados abajo.

### 5.1 `incidents`

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` PK | `@PrimaryGeneratedColumn('uuid')` |
| `title` | `varchar(180)` | obligatorio |
| `description` | `text` | obligatorio |
| `status` | `enum IncidentStatus` | default `abierta` |
| `priority` | `enum IncidentPriority` | default `media` |
| `requester_name` | `varchar(120)` | obligatorio |
| `assigned_to` | `varchar(120)` nullable | responsable |
| `created_at` | `timestamptz` | `@CreateDateColumn` |
| `updated_at` | `timestamptz` | `@UpdateDateColumn` |
| `due_at` | `timestamptz` nullable | **extra** — habilita el resaltado de "vencidas" del Ejercicio 4 |
| `needs_review` | `boolean` default `false` | **extra** — marca de inconsistencia no auto-corregible (Ejercicio 5) |
| `review_reason` | `text` nullable | **extra** — por qué quedó marcada |

### 5.2 `incident_logs` — trazabilidad de cambios relevantes

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `incident_id` | `uuid` FK → `incidents.id` | `ON DELETE CASCADE` |
| `action` | `enum IncidentLogAction` | |
| `old_value` | `varchar(40)` nullable | estado anterior |
| `new_value` | `varchar(40)` nullable | estado nuevo |
| `user_name` | `varchar(120)` | actor del cambio |
| `metadata` | `jsonb` nullable | motivo, origen, flags de reconstrucción |
| `created_at` | `timestamptz` | |

### 5.3 `incident_comments` — comentarios operativos de seguimiento

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `incident_id` | `uuid` FK → `incidents.id` | `ON DELETE CASCADE` |
| `author_name` | `varchar(120)` | |
| `body` | `text` | |
| `created_at` / `updated_at` | `timestamptz` | |

### 5.4 Requisitos adicionales del modelo

**Claves foráneas donde corresponda.** Relaciones TypeORM bidireccionales:

```ts
// incident.entity.ts
@OneToMany(() => IncidentLog, (log) => log.incident)
logs: IncidentLog[];

// incident-log.entity.ts
@ManyToOne(() => Incident, (incident) => incident.logs, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'incident_id' })
incident: Incident;
```

**Índices razonables para las consultas habituales por estado, prioridad y fecha:**

- `incidents`: `status`, `priority`, `created_at`, compuesto `(status, priority)`
- `incident_logs`: `(incident_id, created_at)` — el historial siempre se lee por incidencia y en orden
- `incident_comments`: `(incident_id, created_at)`
- Filtro de texto libre: índice `GIN` sobre una columna generada `STORED`, replicando el patrón que ya existía en el proyecto anterior:

```ts
@Column({
  name: 'search_vector', type: 'tsvector', select: false,
  asExpression: `to_tsvector('spanish', coalesce(title,'') || ' ' || coalesce(description,''))`,
  generatedType: 'STORED',
})
searchVector: string;
```

**Evitar strings mágicos dispersos: centralizar los estados.** Enums en `src/incidents/enums/`, única fuente de verdad:

```ts
export enum IncidentStatus {
  Abierta    = 'abierta',
  EnRevision = 'en_revision',
  Bloqueada  = 'bloqueada',
  Resuelta   = 'resuelta',
}

export enum IncidentPriority {
  Baja = 'baja', Media = 'media', Alta = 'alta', Critica = 'critica',
}

export enum IncidentLogAction {
  Created         = 'created',
  StatusChanged   = 'status_changed',
  Reopened        = 'reopened',
  Commented       = 'commented',
  ConsistencyFix  = 'consistency_fix',
}
```

En el frontend, **un solo** fichero `src/interfaces/incident.interface.ts` replica esos literales. Nunca comparar contra un string suelto en una página o componente.

**Validar que los cambios de estado sean coherentes** → §6.3.
**Guardar los cambios críticos en `incident_logs`** → §6.4.
**Usar transacciones cuando una acción modifique la incidencia y su trazabilidad** → §6.4.

### 5.5 Migraciones (requisito de entrega)

Hoy el backend usa `synchronize: true` y no tiene migraciones. El enunciado pide migraciones explícitamente:

1. `synchronize: false` en `app.module.ts`.
2. Crear `src/config/data-source.ts` exportando un `DataSource` con `entities` y `migrations: ['src/migrations/*.ts']`.
3. Scripts en `package.json`:

```json
"typeorm": "ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js -d src/config/data-source.ts",
"migration:generate": "yarn typeorm migration:generate src/migrations/$npm_config_name",
"migration:run": "yarn typeorm migration:run",
"migration:revert": "yarn typeorm migration:revert"
```

4. Los índices y el `GIN` viajan en la migración, **no** se crean imperativamente desde el seed.

---

## 6. Ejercicio 3 — Programación funcional mínima

Acciones exigidas, todas cubiertas por la API:

- [ ] Crear una incidencia con validación de datos
- [ ] Listar incidencias con filtros por estado, prioridad y texto libre
- [ ] Cambiar el estado respetando transiciones permitidas
- [ ] Registrar en `incident_logs` cada cambio de estado con valor anterior, valor nuevo, usuario/actor y fecha
- [ ] Mostrar el historial de cambios y comentarios de una incidencia
- [ ] Añadir un comentario operativo
- [ ] Gestionar errores de validación de forma clara para el usuario

### 6.1 Contratos de API

Prefijo global `api`. Todo documentado en Swagger (`/api/docs`).

| Método | Ruta | Propósito |
| --- | --- | --- |
| `POST` | `/incidents` | Crear con validación |
| `GET` | `/incidents` | Listar: `status[]`, `priority[]`, `q`, `assignedTo`, `sort`, `limit`, `offset` |
| `GET` | `/incidents/stats` | Conteo por estado (alimenta el contador visual) |
| `GET` | `/incidents/:id` | Detalle |
| `PATCH` | `/incidents/:id/status` | Cambio de estado con transición validada |
| `GET` | `/incidents/:id/activity` | Historial unificado: logs + comentarios, orden cronológico |
| `POST` | `/incidents/:id/comments` | Comentario operativo |
| `GET` | `/maintenance/consistency` | Informe de inconsistencias (solo lectura) |
| `POST` | `/maintenance/consistency/fix` | Corrección; `dryRun: true` por defecto |

Cuerpos principales:

```ts
// POST /incidents
{ title, description, priority, requesterName, assignedTo?, dueAt?, actorName }

// PATCH /incidents/:id/status
{ status: IncidentStatus, actorName: string, reason?: string }  // reason OBLIGATORIO al reabrir

// POST /incidents/:id/comments
{ authorName: string, body: string }
```

### 6.2 Actor simulado (sin autenticación)

No hay login (el enunciado no lo exige). La trazabilidad necesita un actor, así que:

- Toda mutación lleva `actorName` / `authorName` en el body, validado (`@IsString`, `@IsNotEmpty`, `@MaxLength(120)`).
- El frontend muestra un **selector de actor en la cabecera**, persistido en `localStorage`, y lo adjunta a cada mutación.
- Documentar en el README que no hay usuario de prueba porque no hay autenticación.

### 6.3 Máquina de estados

Transiciones mínimas esperadas por el enunciado: `abierta → en revisión → bloqueada o resuelta`. Una incidencia resuelta **no debería volver a abierta sin dejar log explícito de reapertura**.

| Desde | Hacia permitido |
| --- | --- |
| `abierta` | `en_revision` |
| `en_revision` | `bloqueada`, `resuelta` |
| `bloqueada` | `en_revision`, `resuelta` |
| `resuelta` | `abierta` **solo como reapertura explícita** |

Reglas:

- Implementar en un módulo **puro y testeable**: `src/incidents/domain/incident-status.transitions.ts`, con el mapa de transiciones y `canTransition(from, to)`. **No** incrustarlo en el servicio.
- Transición no permitida → `409 Conflict` con mensaje accionable: `No se puede pasar de "bloqueada" a "abierta". Transiciones válidas: en_revision, resuelta.`
- `resuelta → abierta` requiere `reason` no vacío; se registra con `action: IncidentLogAction.Reopened` y `metadata: { reason }`. Sin `reason` → `400`.
- Transición al mismo estado → `409` (no genera log vacío).

### 6.4 Trazabilidad y transacciones

Toda acción que modifique la incidencia **y** su trazabilidad ocurre en una sola transacción:

```ts
await this.dataSource.transaction(async (manager) => {
  const incident = await manager.findOne(Incident, { where: { id }, lock: { mode: 'pessimistic_write' } });
  if (!incident) throw new NotFoundException(`Incidencia ${id} no encontrada`);

  assertTransitionAllowed(incident.status, nextStatus);   // lanza ConflictException

  const previous = incident.status;
  incident.status = nextStatus;
  await manager.save(incident);

  await manager.save(manager.create(IncidentLog, {
    incident: { id },
    action: nextStatus === IncidentStatus.Abierta ? IncidentLogAction.Reopened : IncidentLogAction.StatusChanged,
    oldValue: previous,
    newValue: nextStatus,
    userName: dto.actorName,
    metadata: dto.reason ? { reason: dto.reason } : null,
  }));
});
```

- Si falla el log, se revierte el cambio de estado. Nunca un estado sin su log.
- `POST /incidents` también es transaccional: incidencia + log `created` (`oldValue: null`, `newValue: 'abierta'`).
- Lectura bloqueante (`pessimistic_write`) para evitar que dos cambios concurrentes produzcan logs incoherentes.

### 6.5 Errores claros

- `ValidationPipe` global ya está configurado con `whitelist` + `forbidNonWhitelisted`. Mantenerlo y **añadir `transform: true`** o seguir usando `@Type(() => ...)` en los DTOs, como ya hace el código actual.
- Activar el `ExceptionHandlerService` existente en `src/common/services/` (hoy nadie lo inyecta) o sustituirlo por un `AllExceptionsFilter` global. Mapeo mínimo: `23503` (FK) → 400, `23505` (unique) → 409, `NotFoundException`/`ConflictException` se repropagan, resto → 500 con log.
- El frontend muestra los errores de validación **inline por campo** y el resto en un `toast`, leyendo `error.response.data.message`:

```ts
const errorMessage = isAxiosError(error)
  ? (error.response?.data?.message ?? error.message)
  : 'Algo ha ido mal';
```

### 6.6 Patrones de backend a replicar

Estructura por módulo, ya establecida en el proyecto:

```
src/incidents/
├── incidents.module.ts
├── controllers/incidents.controller.ts
├── services/            incidents.service.ts (fachada) + un servicio por caso de uso
├── dto/                 + index.ts (barrel)
├── entities/            incident.entity.ts, incident-log.entity.ts, incident-comment.entity.ts
├── enums/
└── domain/              incident-status.transitions.ts
src/maintenance/         consistencia de datos (§8)
```

- **Fachada + un servicio por caso de uso**: el controller solo habla con `IncidentsService`, que delega en servicios de un único método `execute()` (patrón de `src/articles/services/articles.service.ts`).
- **DTO de query** extiende `PaginationDto` (`src/common/dtos/pagination.dto.ts`), con `@ApiPropertyOptional` y `@Type(() => Number)`.
- **DTO de respuesta**: clase con `@ApiProperty` y constructor de mapeo desde la entidad (`new IncidentResponseDto(incident)`), no `plainToInstance`.
- **Respuesta paginada**: `PaginatedResponseDto<T>` (`{ data, count, pages }`) documentada en Swagger con `@ApiExtraModels` + `allOf`/`getSchemaPath`.
- **QueryBuilder con `andWhere` condicional y parámetros nombrados.** Nunca interpolar entrada de usuario en SQL:

```ts
if (status?.length) qb.andWhere('incident.status IN (:...status)', { status });
if (q) qb.andWhere(`incident.search_vector @@ plainto_tsquery('spanish', :q)`, { q });
```

- Cada endpoint con `@ApiTags`, `@ApiOperation({ summary, description })` y respuestas documentadas. JSDoc en servicios explicando el **por qué**, no el qué.

---

## 7. Ejercicio 4 — JavaScript / React / interacción

El enunciado pide **al menos dos** de las siguientes. Se implementan cuatro:

- [x] **Filtro rápido por estado sin recargar toda la página** — pestañas/chips de estado que escriben en query params; TanStack Query recupera con la nueva `queryKey` sin recarga del documento.
- [x] **Confirmación antes de resolver o bloquear** — `AlertDialog` que explica el efecto y, al reabrir, exige el motivo.
- [x] **Contador visual de incidencias por estado** — `StatusCounters` sobre `GET /incidents/stats`, invalidado tras cada mutación.
- [x] **Resaltado de incidencias vencidas o bloqueadas** — fila/tarjeta destacada cuando `status === 'bloqueada'` o (`dueAt < now` y estado distinto de `resuelta`).

> No se pide una arquitectura frontend compleja, pero sí orden: se debe poder entender **dónde vive el estado, dónde se dispara la acción y cómo se refresca la interfaz.**

### 7.1 Dónde vive el estado (regla explícita)

| Tipo de estado | Dónde vive |
| --- | --- |
| Filtros, paginación, orden | **URL** (`useSearchParams`) — compartible y recargable |
| Datos del servidor | **TanStack Query** — nunca duplicados en `useState` |
| UI efímera (diálogo abierto, borrador) | `useState` local del componente |
| Actor seleccionado | `localStorage` + un hook `useActor()` |

**Dónde se dispara la acción:** `src/actions/*.action.ts` (axios). **Cómo se refresca:** `useMutation` + `invalidateQueries` con `queryKey` jerárquica:

```ts
queryKey: ['incidents', { status, priority, q, page }]
queryKey: ['incidents', 'stats']
queryKey: ['incidents', id, 'activity']
```

### 7.2 Arquitectura del frontend

Se mantiene el patrón existente **page → hook → action → interface**:

```
src/
├── api/api.ts                     axios con baseURL = import.meta.env.VITE_API_URL
├── actions/*.action.ts            create-incident, list-incidents, change-status,
│                                  add-comment, get-activity, get-stats, consistency
├── hooks/use*.ts                  leen filtros de la URL, devuelven el objeto de useQuery/useMutation
├── interfaces/incident.interface.ts
├── lib/incident-ui.ts             mapa estado/prioridad → etiqueta + variante de badge
├── components/{custom,ui}/
└── pages/IncidentsPage.tsx · IncidentDetailPage.tsx · MaintenancePage.tsx · NotFoundPage.tsx
```

Rutas (`src/app.router.tsx`): `/`, `/incidents/:id`, `/maintenance`, y `*` → 404 (hoy no existe ruta 404). Exports **nombrados**, nunca `default`. `import type` obligatorio (`verbatimModuleSyntax` activo).

### 7.3 Seguridad en la UI

Nunca `dangerouslySetInnerHTML`. Títulos, descripciones y comentarios son entrada de usuario: se renderizan como texto y React los escapa. Longitudes máximas validadas también en el cliente.

---

## 8. Ejercicio 5 — Diagnóstico y corrección de inconsistencias

Hay que **simular** en el propio proyecto una incidencia típica de mantenimiento y dejar la corrección documentada en el README.

### 8.1 Inconsistencias a sembrar en el seed (mínimo tres)

El seed crea un bloque de datos limpios y, claramente separado y comentado, tres casos corruptos:

1. **Incidencia `resuelta` sin log de resolución.**
2. **Incidencia cuyo estado no coincide con su último log** (p. ej. `status = 'bloqueada'` pero el último log dice `new_value = 'resuelta'`).
3. **Log duplicado o incoherente**: dos logs idénticos `(incident_id, action, old_value, new_value)` segundos aparte, y un log cuyo `old_value` no encadena con el `new_value` del log anterior.

### 8.2 Queries de detección (documentar cada una y por qué detecta el problema)

```sql
-- (1) Resueltas sin log de resolución.
-- Detecta el problema porque toda resolución debería haber dejado traza:
-- si el estado final es 'resuelta' y no existe ningún log que lo introduzca,
-- el cambio se escribió fuera de la transacción que garantiza la trazabilidad.
SELECT i.id, i.title
FROM incidents i
WHERE i.status = 'resuelta'
  AND NOT EXISTS (
    SELECT 1 FROM incident_logs l
    WHERE l.incident_id = i.id AND l.new_value = 'resuelta'
  );

-- (2) Estado distinto del new_value del último log.
-- El último log es, por definición, el que fijó el estado actual.
-- Si no coinciden, o se perdió un log o se modificó el estado sin registrarlo.
SELECT i.id, i.status AS current_status, last_log.new_value AS last_logged_status
FROM incidents i
JOIN LATERAL (
  SELECT l.new_value, l.created_at
  FROM incident_logs l
  WHERE l.incident_id = i.id AND l.new_value IS NOT NULL
  ORDER BY l.created_at DESC, l.id DESC
  LIMIT 1
) AS last_log ON TRUE
WHERE i.status <> last_log.new_value;

-- (3a) Logs duplicados exactos.
-- Dos transiciones idénticas sobre la misma incidencia no son un hecho real:
-- un cambio de estado solo puede ocurrir una vez desde un mismo valor de origen.
SELECT incident_id, action, old_value, new_value, COUNT(*) AS occurrences,
       ARRAY_AGG(id ORDER BY created_at) AS log_ids
FROM incident_logs
GROUP BY incident_id, action, old_value, new_value
HAVING COUNT(*) > 1;

-- (3b) Cadena de logs rota.
-- El old_value de un log debe ser el new_value del log anterior de esa incidencia.
-- Si no encadena, falta un log intermedio o alguno se escribió con valores erróneos.
SELECT id, incident_id, old_value, previous_new_value
FROM (
  SELECT l.id, l.incident_id, l.old_value,
         LAG(l.new_value) OVER (PARTITION BY l.incident_id ORDER BY l.created_at, l.id) AS previous_new_value
  FROM incident_logs l
  WHERE l.new_value IS NOT NULL
) chain
WHERE previous_new_value IS NOT NULL AND old_value <> previous_new_value;
```

### 8.3 Forma de diagnóstico: endpoints (decisión tomada)

En lugar de un comando Artisan, el diagnóstico es **parte de la API** y, por tanto, invocable desde Swagger, Postman y la propia UI:

- `GET /api/maintenance/consistency` → informe **solo lectura**, agrupado por tipo, con `id`, datos del conflicto y la acción propuesta.
- `POST /api/maintenance/consistency/fix` → body `{ dryRun?: boolean = true, checks?: string[], actorName: string }`.
  - `dryRun: true` (**por defecto**): devuelve el plan exacto de cambios sin escribir nada. Es la opción dry-run que exige el enunciado.
  - `dryRun: false`: aplica dentro de una transacción y deja log de auditoría (`action: consistency_fix`) por cada cambio.

Las queries viven en `src/maintenance/queries/` con un fichero por comprobación, cada uno con su JSDoc explicando qué detecta y por qué, de modo que la consulta sea "claramente identificable" como pide el enunciado.

### 8.4 Política de corrección (prudencia exigida)

> No todas las inconsistencias deben arreglarse automáticamente si no hay información suficiente.

| Caso | Decisión | Justificación |
| --- | --- | --- |
| (1) Resuelta sin log | **Auto-corregible**: crear el log faltante con `action: consistency_fix`, `new_value: 'resuelta'`, `user_name: 'system'`, `metadata: { reconstructed: true, inferredFrom: 'incidents.status' }` | El estado final es un hecho observable; solo falta la traza. Se marca como reconstruida para no confundirla con una traza real. |
| (2) Estado ≠ último log | **NO se corrige automáticamente**: `needs_review = true` + `review_reason` | No hay información para decidir cuál es la verdad: puede haberse perdido un log (y el estado es correcto) o haberse pisado el estado (y el log es correcto). Elegir al azar destruiría información. Se deja a revisión manual. |
| (3a) Duplicado exacto | **Auto-corregible**: conservar el más antiguo, borrar el resto | Es ruido demostrable: la misma transición no puede haber ocurrido dos veces. |
| (3b) Cadena rota | **NO se corrige**: marcar para revisión | Falta información sobre el log intermedio ausente; inventarlo falsearía la trazabilidad. |

El informe distingue siempre `autoFixable: true/false` y, en los no corregibles, el motivo. Todo esto va explicado en el README.

### 8.5 Pantalla `/maintenance`

Informe por tipo, previsualización del dry-run antes de aplicar, botón "Aplicar correcciones" con `AlertDialog` de confirmación, y listado de incidencias con `needs_review = true` para revisión manual.

---

## 9. Uso de IA

El enunciado permite usar IA pero obliga a documentarlo en una carpeta con nombre exacto **`/ai-process`** en la raíz (hoy existe `docs/ai-support`: mover/renombrar). Contenido mínimo:

- [ ] Herramientas utilizadas
- [ ] Prompts principales o resumen de los prompts
- [ ] Partes generadas con ayuda de IA
- [ ] Cambios, correcciones o decisiones tomadas manualmente
- [ ] Errores detectados en la salida de la IA y cómo se corrigieron

No hace falta escribir una novela: basta con demostrar que se ha dirigido y revisado el proceso.

---

## 10. Entrega y README

### Entrega

- [ ] Código fuente del proyecto
- [ ] Migraciones y seeders necesarios
- [ ] README con instrucciones para instalar y ejecutar
- [ ] `.env.example` sin credenciales reales
- [ ] Explicación breve de las inconsistencias simuladas y de cómo se han diagnosticado/corregido
- [ ] Documentación de uso de IA

### README mínimo esperado

El README actual describe el proyecto de noticias: **se reescribe por completo**. Debe permitir ejecutar el proyecto sin adivinar:

- [ ] Requisitos necesarios — aquí **Node 20+, Docker y Docker Compose** en lugar de PHP/Composer/MySQL, indicando la equivalencia y el motivo de la desviación autorizada
- [ ] Pasos de instalación
- [ ] Comandos para migrar y cargar datos de ejemplo
- [ ] Comando para levantar la aplicación
- [ ] Comando o pasos para ejecutar el **diagnóstico de inconsistencias** (los endpoints de §8.3, con ejemplo de `curl`)
- [ ] Usuario de prueba si hay autenticación → **no hay autenticación**: explicar el actor simulado
- [ ] Notas sobre decisiones técnicas

---

## 11. Alcance: lo que NO se implementa

El enunciado lo dice explícitamente. No implementar:

- Autenticación completa
- Roles y permisos avanzados
- Notificaciones
- Tests extensos
- Docker (más allá de PostgreSQL, usado solo para no configurar nada en la máquina)
- Deploy público
- Integraciones externas

> Es preferible una solución pequeña, consistente y ejecutable que una aplicación grande incompleta.

Corolario operativo: ante la duda entre añadir una capa de abstracción o resolverlo de forma directa y legible, **lo directo**. Cualquier extra debe quedar justificado en el README por un requisito del enunciado.

---

## 12. Convenciones de código

- **Idioma:** identificadores, tipos y comentarios en **inglés**; **UI y valores de dominio en español** (los estados del enunciado son `abierta`, `en revisión`, `bloqueada`, `resuelta`). Los enums usan claves inglesas con valores en español.
- **Backend:** ficheros kebab-case con sufijo de rol (`incident-find-all.service.ts`, `create-incident.dto.ts`), carpetas en plural, barrels `dto/index.ts` consistentes (el proyecto anterior los tenía incompletos: no repetir el error).
- **Frontend:** componentes `PascalCase.tsx`, hooks `useXxx.ts`, acciones `kebab-case.action.ts` exportando `xxxAction`. Exports nombrados.
- **TypeScript:** `tsconfig.app.json` del frontend es estricto (`strict`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `erasableSyntaxOnly`) → `import type` obligatorio y cero variables sin usar. El `tsconfig.json` del backend viene laxo (`strictNullChecks: false`, `noImplicitAny: false`): **activar ambos** al empezar, es parte del criterio técnico que se evalúa.
- **SQL:** siempre parámetros nombrados de TypeORM. Ninguna interpolación de entrada de usuario.
- **Comentarios:** JSDoc breve explicando el *por qué* en servicios, queries de consistencia y la máquina de estados. No comentar lo obvio.
- **Commits:** mensajes imperativos y acotados por ejercicio (`feat(incidents): add status transition guard`).

---

## 13. Tests mínimos

Alcance deliberadamente acotado (el enunciado no pide tests extensos).

### Backend — `*.spec.ts` junto al fichero, `rootDir: src`, Jest + `@nestjs/testing`

1. `incident-status.transitions.spec.ts` — tabla completa de transiciones: todas las permitidas, todas las rechazadas, el mismo estado, y la reapertura `resuelta → abierta` (permitida solo con motivo).
2. `incident-change-status.service.spec.ts` — con repositorio/manager mockeado: verifica que el log se escribe con `oldValue`/`newValue`/`userName` correctos, que todo ocurre **dentro de la misma transacción** y que un fallo al guardar el log impide persistir el estado.
3. `consistency.queries.spec.ts` — cada comprobación detecta su caso sembrado y no produce falsos positivos sobre los datos limpios.

### Frontend — Vitest + Testing Library

Requiere preparación que hoy falta:

- Añadir `test.setupFiles: './src/tests/setup.ts'` en `vite.config.ts` (existe `test: { environment: 'jsdom', globals: true }`, pero no `setupFiles`).
- Instalar `@testing-library/jest-dom` y `@testing-library/user-event` (no están).
- Los renders deben envolverse en `QueryClientProvider` + `createMemoryRouter`, porque los hooks dependen de `useSearchParams`/`useParams`.

Tests:

1. `StatusCounters` — renderiza el conteo por estado a partir de los datos del hook mockeado.
2. Filtro rápido por estado — al pulsar un estado, se actualiza el query param y se solicitan los datos filtrados.

---

## 14. Checklist de entrega

**Ejercicio 1 — Maquetación**
- [ ] Cabecera con nombre + descripción funcional
- [ ] Listado con prioridad, estado, fecha y responsable/solicitante
- [ ] Indicadores visuales por estado
- [ ] Formulario de creación
- [ ] Acción visible de cambio de estado
- [ ] Acceso al historial
- [ ] Responsive escritorio/móvil, sin componentes gigantes

**Ejercicio 2 — Modelo de datos**
- [ ] Migraciones de `incidents`, `incident_logs`, `incident_comments` con los campos mínimos
- [ ] Claves foráneas
- [ ] Índices por estado, prioridad y fecha
- [ ] Estados centralizados, sin strings mágicos
- [ ] Validación de coherencia de transiciones
- [ ] Cambios críticos en `incident_logs`
- [ ] Transacciones en acciones que tocan incidencia + traza

**Ejercicio 3 — Funcionalidad**
- [ ] Crear con validación
- [ ] Listar con filtros estado/prioridad/texto
- [ ] Cambio de estado con transiciones permitidas
- [ ] Log con valor anterior, nuevo, actor y fecha
- [ ] Historial de cambios y comentarios
- [ ] Añadir comentario
- [ ] Errores de validación claros para el usuario

**Ejercicio 4 — Interacción** (≥2 requeridas, 4 implementadas)
- [ ] Filtro rápido por estado sin recargar
- [ ] Confirmación antes de resolver o bloquear
- [ ] Contador por estado
- [ ] Resaltado de vencidas/bloqueadas

**Ejercicio 5 — Inconsistencias**
- [ ] Tres inconsistencias sembradas
- [ ] Detectadas por SQL identificable
- [ ] Diagnóstico accesible (endpoints + pantalla)
- [ ] Corrección segura y explicada
- [ ] Dry-run disponible
- [ ] Queries documentadas con su por qué
- [ ] Justificación de lo que no se corrige automáticamente

**Entrega**
- [ ] `/ai-process` con los cinco puntos
- [ ] README con los siete puntos del apartado 10
- [ ] `.env.example` sin credenciales
- [ ] Migraciones y seed funcionando desde cero (`docker compose up -d` → `migration:run` → `seed` → arranca)
