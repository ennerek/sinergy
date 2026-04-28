# sinergy

## Para GitHub Copilot · Next.js + Supabase + Vercel

---

## STACK TÉCNICO

- **Framework:** Next.js 14 con App Router
- **Base de datos + Auth:** Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Pagos:** Stripe (suscripciones mensuales)
- **IA (SISI):** Anthropic Claude API (`claude-sonnet-4-20250514`) para el chat
- **Estilos:** Tailwind CSS + CSS Modules para estilos específicos del diseño
- **Deploy:** Vercel (con variables de entorno configuradas)
- **Idiomas:** ES/EN con `next-intl`

---

## ESTRUCTURA DE CARPETAS

```
/
├── app/
│   ├── globals.css               ← tokens CSS del HTML (:root vars)
│   ├── layout.tsx                ← fuentes Playfair Display + DM Sans
│   ├── page.tsx                  ← LANDING PAGE (público)
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── onboarding/
│   │   └── page.tsx              ← cuestionario 5 pasos con SISI
│   └── (app)/
│       ├── layout.tsx            ← shell móvil + bottom nav
│       ├── home/page.tsx
│       ├── sinergias/page.tsx
│       ├── red/page.tsx
│       ├── mentores/page.tsx
│       └── perfil/page.tsx
├── components/
│   ├── overlays/                 ← Chat, Contact, Niveles, Makers, Add
│   ├── ui/                       ← MatchItem, PostItem, Thread, MentorCard...
│   └── layout/                   ← PhoneShell, BottomNav, StatusBar
├── lib/
│   ├── supabase/                 ← client.ts, server.ts, middleware.ts
│   ├── stripe.ts
│   └── sisi.ts                  ← wrapper Claude API
├── api/ (route handlers)
│   ├── synergies/route.ts
│   ├── matches/route.ts
│   ├── connections/route.ts
│   ├── reflections/route.ts
│   ├── sisi/route.ts
│   ├── invitations/route.ts
│   └── stripe/webhook/route.ts
└── supabase/
    ├── migrations/
    │   └── 001_initial.sql       ← schema completo
    └── seed.sql
```

---

## PARTE 1 — LANDING PAGE (`/`)

**Objetivo:** Página pública de marketing que presenta la app y dirige al registro.  
**Diseño visual:** Fondo oscuro `#14140F` con gradientes radiales igual que el `body` del HTML de referencia. Logo "Makers Synergy *Charity*" con la palabra Charity en dorado `#B8922E`. Tipografía Playfair Display para títulos.

**Secciones obligatorias:**

### Hero
- Fondo: `background: #14140F` con `radial-gradient(ellipse 60% 50% at 20% 50%, rgba(26,71,49,0.15)...)` igual al HTML
- Izquierda: headline `"Sinergias para empresarios"` en Playfair Display, subtítulo, CTA principal `"Unirme al círculo →"`, badge `"Donас mientras ganas"` en dorado
- Derecha: iframe o screenshot animado del phone mockup del HTML (o el propio HTML embebido en un iframe a escala)
- Badge flotante: `"Miembro del círculo · Rotary Valencia"` con punto verde animado (CSS `animation: pulse 2s infinite`)

### Cómo funciona (4 pasos)
Replicar exactamente el bloque `flow_title` del HTML:
1. **Publicas** qué ofreces y qué buscas
2. **SISI cruza** con miles de perfiles
3. **Pide permiso** a ambos por separado
4. **Si los dos dicen sí** conexión directa

Nota de privacidad: "Tu teléfono, email y datos de contacto **solo se comparten cuando ambos aceptáis**."

### Estadísticas
- `3.412` miembros activos
- `6` grupos empresariales conectados
- `25%` de la recaudación a Makers-Ong

### Grupos empresariales (cards)
Mostrar los 6 grupos del onboarding: Rotary Club (★), Smart Meeting (◆), BNI (▲), AJE/Jóvenes empresarios (✦), Círculo Empresarios (◇), Otro grupo (◉). Mismos iconos y colores del HTML.

### Proyectos Makers-Ong
Preview del proyecto activo (escuela rural en Senegal), barra de progreso 68%, "4.240€ de 6.200€".

### CTA Final
Botón grande "Empezar → (2 minutos)" estilo del splash del HTML.

### Footer
`"Diseñado por MAKERS-ONG · Operado por PIAITIC · Pia Dreams 2026"` en dorado/gris oscuro.

---

## PARTE 2 — AUTENTICACIÓN Y ONBOARDING

### 2.1 Registro (`/auth/register`)
- Fondo oscuro igual al landing
- Formulario centrado: email, contraseña, confirmar contraseña
- OAuth: "Continuar con Google" (Supabase Auth)
- Al registrar → redirige a `/onboarding` si `onboarding_completed = false`
- Si ya completó onboarding → redirige a `/(app)/home`

### 2.2 Login (`/auth/login`)
- Mismos estilos que registro
- Email/contraseña + Google
- "¿Olvidaste tu contraseña?" → reset por email via Supabase

### 2.3 Onboarding (`/onboarding`)
**Replicar exactamente la pantalla splash del HTML** (`#splash`). El onboarding tiene 2 fases:

**Fase A — Intro con SISI:**
- Pantalla completa con fondo `var(--tl)` (#1A4731)
- Avatar de SISI (imagen circular)
- Texto: `"✦ ANTES DE EMPEZAR"` en letras pequeñas
- Quote: `"Las mejores oportunidades no están en tu cabeza..."`
- Tagline: `"SINERGIAS PARA EMPRESARIOS"`
- Descripción de SISI
- Botón `"Empezar → (2 minutos)"`
- Toggle de idioma ES/EN en la esquina

**Fase B — Cuestionario 5 pasos (igual que `QUESTIONS` del HTML):**

Cada paso muestra:
- Barra de progreso en `var(--tl)` con `width: ((paso+1)/5)*100%`
- Label "Paso X de 5"
- Bubble de SISI con avatar + pregunta
- Input/opciones según el tipo

Los 5 pasos exactos son:

**Paso 1** — Input de texto libre
- Pregunta: `"Para empezar — ¿cómo te llamas?"`
- Placeholder: `"Tu nombre y apellido..."`

**Paso 2** — Multi-selección (mínimo 1)
- Pregunta: `"¿A qué grupos empresariales perteneces? Puedes elegir varios."`
- Opciones (con icono, texto, subtexto):
  - ★ Rotary Club — "Red internacional de empresarios con vocación social"
  - ◆ Smart Meeting — "Comunidad de fundadores y directivos tech"
  - ▲ BNI — "Referral marketing entre empresarios locales"
  - ✦ AJE / Jóvenes empresarios — "Asociación de empresarios menores de 41"
  - ◇ Círculo Empresarios — "Ex-CEOs, consejeros, operadores senior"
  - ◉ Otro grupo — "Especifica al completar el perfil"

**Paso 3** — Select desplegable
- Pregunta: `"¿En qué sector opera tu empresa?"`
- Opciones: Tecnología/Software, Servicios profesionales, Inmobiliario, Industria/Manufactura, Salud y bienestar, Educación, Hostelería/Turismo, Finanzas/Inversión, Consumo/Retail, Legal, Otro

**Paso 4** — Multi-selección (mínimo 1)
- Pregunta: `"¿Qué tipo de sinergias te interesan?"`
- Opciones: 🤝 Clientes cruzados, 🔗 Complementariedad, 💰 Inversión, 🎪 Eventos conjuntos, 🌍 Internacionalización, 🎓 Mentoría

**Paso 5** — Multi-selección (mínimo 1)
- Pregunta: `"¿Y qué puedes ofrecer a la red?"`
- Opciones: 💻 Tecnología/producto, 👥 Red de contactos, 🎓 Expertise, 🏢 Espacios o recursos, 💸 Inversión, 🎪 Organización eventos

**Pantalla de resultado (tras paso 5):**
- Fondo `var(--tl)` degradado a `#0F3624`
- Título: `"Tu círculo está activo"`
- Subtítulo: `"SISI ha cruzado tu perfil con 3.412 miembros"`
- 4 cards de resultado:
  1. Tu posición en la red
  2. Primeras sinergias detectadas
  3. Regla del círculo (publicar busco + ofrezco cada semana)
  4. Card oscura: "★ DONAS MIENTRAS GANAS — El 25% de tu cuota mensual se destina a proyectos de Makers-Ong"
- Botón `"Entrar →"` → guarda respuestas en Supabase → actualiza `onboarding_completed = true` → redirige a `/(app)/home`

---

## PARTE 3 — APP PRINCIPAL (`/(app)`)

### Shell (`/(app)/layout.tsx`)
**Replicar exactamente la estructura del HTML:**
- Fondo del body: `#14140F` con los 2 gradientes radiales
- Barra superior de escritorio: logo "Makers Synergy *Charity*" + badge "Miembro del círculo · Rotary Valencia" con punto verde pulsante
- Contenedor `phone-wrap` (max-width 900px, centrado)
- Teléfono (`.phone`): 390×780px, `border-radius: 44px`, `background: var(--pbg)`, sombras del HTML
- Status bar (`.sbar`): fondo `var(--tl)`, reloj en tiempo real, iconos señal/batería, notch negro central
- Panel de info derecho (desktop) con descripción de la app

**Bottom Navigation** (5 tabs):
```
🏠 Inicio | 🎯 Sinergias | 🕸️ Red | 🧠 Mentores | 👤 Perfil
```
- Activo: color `var(--tl)`, punto verde abajo
- Inactivo: `var(--mut)`
- Borde superior `var(--bdr)`, fondo blanco, padding `8px 4px 12px`

---

### PANTALLA HOME (`/home`)

**Header verde** (`.hh`):
- Fecha del día (día semana + fecha)
- Saludo personalizado con nombre del usuario
- Pill de grupo: `"★ [Grupo] · Miembro"`
- Avatar del usuario (iniciales, 44×44px, border-radius 12px)
- Pseudo-elemento con letra "N" en Playfair Display gigante semitransparente

**Pulse Card** (`.pulse-card`):
- Sube sobre el header con `margin-top: -12px`, `z-index: 2`, sombra suave
- "PULSO DE LA SEMANA" + "Activo"
- Grid 3 columnas: MATCHES (número) | ABIERTOS (número) | EN TU RED (número)
- Datos reales de Supabase del usuario

**Card Proyecto Makers-Ong** (misma del HTML):
- Fondo `linear-gradient(135deg, var(--tl) 0%, #0E3426 100%)`
- Icono ❤ en dorado, título del proyecto activo
- Barra de progreso (porcentaje recaudado)
- "25% DE CADA CUOTA" en Playfair italic dorado
- Click → abre overlay Makers-Ong

**Siguiente Paso** (`.nxt`):
- Borde 2px `var(--tl)`, border-radius 13px
- Icono 📝, texto dinámico con conteo de buscos activos esta semana
- Click → navega a Sinergias

**Atajos del círculo** (chips):
- 🤖 Asistente IA → abre chat SISI
- 🧠 Pedir consejo → navega a Mentores
- 🕸️ Ver red → navega a Red
- 🎯 Mis sinergias → navega a Sinergias

**Flujo del conector** (card explicativa con 4 pasos circulares, exactamente igual al HTML)

**Matches detectados** (lista `.match-item`):
- Datos reales de la tabla `matches` de Supabase
- Score coloreado: ≥90 = verde `var(--match-high)`, 70-89 = dorado `var(--match-med)`, <70 = naranja `var(--match-low)`
- Botón "Proponer" → abre overlay Contact
- Match VIP (score más alto sin nivel 3): borroso con 🔒, click → abre overlay Niveles

---

### PANTALLA SINERGIAS (`/sinergias`)

**Tabs** (Busco / Ofrezco):
- Tab activo: fondo `var(--tl)`, texto blanco
- Tab inactivo: fondo blanco, borde `var(--bdr)`

**Panel BUSCO:**
- Header verde con `"Lo que busco"` y subtítulo
- Textarea libre (placeholder: "Busco agencia de eventos...")
- Chips de categoría (multi-selección): Servicios, Inversión, Clientes, Talento, Espacios
- Chips de rango presupuesto: < 10k | 10–50k | 50–200k | 200k–1M | 1M+
- Botón "Publicar busco" en verde
- Lista "Tus buscos activos" con `.post-item` (texto, matches, tiempo) — datos de Supabase

**Panel OFREZCO:**
- Header dorado `var(--gd)` con `"Lo que ofrezco"`
- Textarea (placeholder: "Ofrezco dashboards de IA vertical...")
- Chips de categoría: Tecnología, Red contactos, Expertise, Espacio, Inversión
- Chips de ticket: mismos rangos
- Botón "Publicar ofrezco" en dorado (`.post-btn.gold`)
- Lista "Tus ofrezcos activos" — datos de Supabase

**Lógica backend:**
- Al publicar un busco/ofrezco → insertar en `synergies` → trigger en Supabase que recalcula matches con otros usuarios vía función Edge Function

---

### PANTALLA RED (`/red`)

**Header verde:**
- Título "Tu red neuronal" + subtítulo sobre nodos y densidad
- Botón "+ Añadir" en dorado → abre overlay Add
- Card de alcance total: número grande en Playfair italic dorado, descripción

**SVG Red neuronal:**
- Replicar exactamente el SVG del HTML (nodo central "Tú", 6 nodos de grupos con tamaño proporcional a miembros, líneas con grosor variable)
- Datos reales: nombre del usuario en el nodo central, tamaños según `user_groups` de Supabase
- Leyenda: Directo (dorado), 2º grado activo (verde), 2º grado latente (beige)

**Barra de nivel actual:**
- Badge con número de nivel (I / II / III)
- Texto "TU NIVEL ACTUAL · Nivel X · [descripción]"
- Botón "Ver niveles" → abre overlay Niveles

**Lista grupos conectados:**
- Grupos de nivel 1 (directos): badge verde "✓ NIVEL 1"
- Grupos de nivel 2 (2º grado): badge "NIVEL 2", clase `locked`, click → overlay Niveles
- Grupo VIP nivel 3: estilo morado `#3C2F5A`, badge "◆ VIP", `locked`
- Cada grupo: icono con iniciales en color, nombre, fuente del contacto, conteo de miembros

---

### PANTALLA MENTORES (`/mentores`)

**Card SISI Consejo del círculo:**
- Fondo `var(--tl)`, avatar de SISI, nombre, subtítulo "24 mentores activos esta semana"
- Descripción del formato (reflexión 200 chars, respuestas honestas por la mañana)
- Botón "Publicar una reflexión ✦" → abre modal de creación

**Sección Reflexiones abiertas:**
- Label "Reflexiones abiertas"
- Lista de `.thread` con datos de Supabase:
  - Avatar (iniciales en border-radius 9px)
  - Nombre, grupo, tiempo relativo
  - Texto en Playfair Display italic
  - Acciones: X opiniones | X guardado | "Responder →"
- Paginación (cargar más)

**Sección Mentores destacados:**
- Grid 2 columnas de `.mentor-card`
- Avatar dorado (iniciales), nombre, rol, calificación "★ 4.X"
- Click → perfil de mentor

---

### PANTALLA PERFIL (`/perfil`)

**Header verde:**
- Avatar grande (60×60, border-radius 16px, borde dorado)
- Nombre completo, título/empresa
- Pill de grupo y año de ingreso
- Pseudo-elemento círculo decorativo en dorado

**Stats grid (3 columnas):**
- En tu red (conteo real de conexiones)
- Alcance (1ª, 2ª, 3ª según nivel)
- Sinergias (conteo de matches activos)

**Intereses del motor:**
- Chips azul-verde con las opciones elegidas en onboarding
- Editable (click → modal)

**Volumen de operaciones:**
- Texto explicativo de privacidad
- Selector de ticket habitual (chips)
- Selector de rol habitual (Proveedor, Cliente, Inversor, Busco inversión, Socio/partner)

**Menú de cuenta** (`.si` items):
- ✏️ Editar perfil → modal/página
- ❤ Proyectos Makers-Ong → overlay Makers
- ◆ Niveles de acceso → overlay Niveles
- ➕ Añadir a mi red → overlay Add
- 🤖 Asistente IA → overlay Chat
- ⚙️ Preferencias del motor → página settings
- 🔕 Notificaciones → página notificaciones
- 💳 Plan y facturación · "Círculo · 29€/mes" → portal Stripe
- 🚪 Salir del círculo (pausar cuenta)

---

## OVERLAYS / MODALES

### Chat SISI (`.cov`)
- Posición: `absolute inset-0`, `z-index: 20`, fondo `var(--pbg)`
- Header verde: botón ‹ volver, avatar SISI, "SISI · Asistente Synergy", punto pulsante verde
- Lista de mensajes: burbujas izq (SISI, fondo blanco) y der (usuario, fondo verde)
  - Mensajes de SISI en verde oscuro con label "SISI · IA" en dorado
  - "Suggestion cards" con borde izq dorado (`.sug-card`)
- Input bar: input redondeado + botón enviar verde
- **Lógica:** llamar a `/api/sisi` que usa Claude API con contexto del perfil del usuario. System prompt: *"Eres SISI, asistente de sinergias empresariales de Makers Synergy Charity. Conoces el perfil del usuario, sus buscos, ofrezcos y matches. Ayuda a priorizar conexiones, preparar presentaciones de sinergia y dar consejos concretos. Respuestas cortas y directas."*

### Contact / Proponer conexión (`.contact-ov`)
- Bottom sheet con animación `slideUp`
- Header verde con avatar de la persona, nombre, subtítulo del match
- Flujo del conector: 4 pasos numerados igual que el HTML
- Nota de privacidad (datos solo se comparten si ambos aceptan)
- Textarea pre-rellenada: "Creo que podemos cruzar algo interesante..."
- Botones: "Cancelar" / "Proponer conexión"
- Tras enviar: pantalla de confirmación "Propuesta enviada — esperamos la respuesta de [nombre]"
- **Backend:** inserta en `connection_requests`, envía notificación al otro usuario

### Niveles de acceso (`.niv-ov`)
- Full overlay, `z-index: 25`
- Header verde con botón ×
- 3 cards de niveles:
  - **Nivel 1** — "Círculo Básico" (activo si suscrito), 29€/mes. Feats: acceso a grupos propios, busco/ofrezco ilimitado, matches IA básicos, 25% va a Makers-Ong.
  - **Nivel 2** — "Red Ampliada", 59€/mes. Feats: acceso a todos los grupos del círculo (~3.000 miembros), matches IA avanzados, contacto directo con 2 grupos adicionales, evento trimestral.
  - **Nivel 3** — "Inner Circle VIP" (◆), acceso solo por invitación. Feats: 500 miembros globales, cenas privadas trimestrales, SISI premium 24h, matches solo entre VIPs verificados, red invisible.
- Botones de upgrade o "Solicitar invitación"
- Nota footer sobre Makers-Ong y transparencia financiera
- **Backend:** crea checkout session de Stripe para upgrade

### Proyectos Makers-Ong (`.makers-ov`)
- Full overlay verde oscuro con proyectos del mes
- Proyecto activo con barra de progreso real
- Historial de proyectos anteriores
- Sección de transparencia: total recaudado, % a ONG

### Añadir a mi red (`.add-ov`)
- Bottom sheet
- Dos modos (tabs): "Ya está en Synergy" / "Invitar al círculo"
- **Modo buscar:** input de búsqueda → resultados en tiempo real de `profiles` · botón "Añadir"
- **Modo invitar:** campos nombre, email, teléfono (opcional), grupo (chips), empresa/rol, mensaje personal · botón "Enviar invitación"
- **Backend:** modo buscar → inserta en `connections`; modo invitar → inserta en `invitations`, envía email via Supabase Edge Function

---

## ESQUEMA DE BASE DE DATOS (Supabase)

```sql
-- =============================================
-- 001_initial.sql
-- =============================================

-- HABILITAR EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- para búsqueda full-text

-- =============================================
-- PERFILES DE USUARIO
-- =============================================
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT,
  company_name    TEXT,
  role_title      TEXT,
  sector          TEXT,
  bio             TEXT,
  avatar_url      TEXT,
  lang            TEXT DEFAULT 'es' CHECK (lang IN ('es','en')),
  deal_ticket_min TEXT DEFAULT '<10k',  -- '<10k' | '10k-50k' | '50k-200k' | '200k-1M' | '1M-5M' | '5M+'
  deal_ticket_max TEXT DEFAULT '<10k',
  usual_roles     TEXT[] DEFAULT '{}',  -- ['proveedor','cliente','inversor','busca_inversion','socio']
  access_level    SMALLINT DEFAULT 1 CHECK (access_level IN (1,2,3)),
  synergy_interests TEXT[] DEFAULT '{}', -- ['clientes_cruzados','complementariedad','inversion','eventos','internacionalizacion','mentoria']
  offerings       TEXT[] DEFAULT '{}',   -- ['tecnologia','red_contactos','expertise','espacios','inversion','eventos']
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_answers   JSONB DEFAULT '{}', -- respuestas crudas del cuestionario
  is_mentor       BOOLEAN DEFAULT false,
  mentor_rating   DECIMAL(3,2),
  mentor_bio      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: cada usuario solo ve/edita su propio perfil salvo consultas de red
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "profiles_read_others" ON profiles FOR SELECT USING (true); -- perfiles visibles para matching

-- =============================================
-- GRUPOS EMPRESARIALES
-- =============================================
CREATE TABLE groups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        TEXT UNIQUE NOT NULL,  -- 'rotary', 'smart-meeting', 'bni', 'aje', 'circulo', 'otro'
  name        TEXT NOT NULL,
  icon        TEXT NOT NULL,         -- '★', '◆', '▲', '✦', '◇', '◉'
  description TEXT,
  color       TEXT DEFAULT '#1A4731',
  tier_required SMALLINT DEFAULT 1,  -- nivel mínimo para acceder
  member_count  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Datos iniciales de grupos
INSERT INTO groups (slug, name, icon, description, color, tier_required) VALUES
  ('rotary',        'Rotary Club',               '★', 'Red internacional de empresarios con vocación social', '#B8922E', 1),
  ('smart-meeting', 'Smart Meeting',             '◆', 'Comunidad de fundadores y directivos tech',           '#1A4731', 2),
  ('bni',           'BNI',                       '▲', 'Referral marketing entre empresarios locales',        '#1A4731', 2),
  ('aje',           'AJE / Jóvenes empresarios', '✦', 'Asociación de empresarios menores de 41',            '#C8BBA0', 2),
  ('circulo',       'Círculo Empresarios',       '◇', 'Ex-CEOs, consejeros, operadores senior',              '#C8BBA0', 2),
  ('inner-circle',  'Inner Circle — Global',     '◆', 'Lo mejor de cada grupo · 500 miembros seleccionados', '#3C2F5A', 3);

-- =============================================
-- MEMBRESÍAS DE GRUPOS
-- =============================================
CREATE TABLE user_groups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  group_id    UUID REFERENCES groups(id) ON DELETE CASCADE,
  is_direct   BOOLEAN DEFAULT true,     -- false = 2º grado
  via_user_id UUID REFERENCES profiles(id), -- quién conecta en 2º grado
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, group_id)
);

ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_groups_own" ON user_groups FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_groups_read" ON user_groups FOR SELECT USING (true);

-- =============================================
-- SINERGIAS (BUSCOS Y OFREZCOS)
-- =============================================
CREATE TABLE synergies (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('busco', 'ofrezco')),
  description   TEXT NOT NULL,
  categories    TEXT[] DEFAULT '{}',
  budget_range  TEXT,  -- '<10k' | '10k-50k' | '50k-200k' | '200k-1M' | '1M+'
  match_count   INT DEFAULT 0,
  is_active     BOOLEAN DEFAULT true,
  expires_at    TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE synergies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "synergies_own" ON synergies FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "synergies_read_active" ON synergies FOR SELECT USING (is_active = true);

-- =============================================
-- MATCHES IA
-- =============================================
CREATE TABLE matches (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id_a       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_id_b       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  score           SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
  score_reasons   TEXT[],             -- razones del match
  synergy_id_a    UUID REFERENCES synergies(id),
  synergy_id_b    UUID REFERENCES synergies(id),
  requires_level  SMALLINT DEFAULT 1, -- nivel mínimo para ver este match
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','proposed','accepted','declined','connected','expired')),
  generated_at    TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  UNIQUE(user_id_a, user_id_b)        -- previene duplicados
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "matches_own" ON matches FOR SELECT USING (auth.uid() = user_id_a OR auth.uid() = user_id_b);

-- =============================================
-- SOLICITUDES DE CONEXIÓN (flujo de consentimiento)
-- =============================================
CREATE TABLE connection_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  match_id        UUID REFERENCES matches(id),
  message         TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','expired')),
  -- Cuando ambos aceptan, se crea una fila en connections
  to_responded_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conn_req_own" ON connection_requests FOR ALL
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- =============================================
-- CONEXIONES ESTABLECIDAS
-- =============================================
CREATE TABLE connections (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id_a   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_id_b   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  request_id  UUID REFERENCES connection_requests(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id_a, user_id_b)
);

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "connections_own" ON connections FOR SELECT
  USING (auth.uid() = user_id_a OR auth.uid() = user_id_b);

-- =============================================
-- REFLEXIONES (FORO DE MENTORES)
-- =============================================
CREATE TABLE reflections (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL CHECK (char_length(content) <= 280),
  reply_count INT DEFAULT 0,
  save_count  INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reflections_all" ON reflections FOR SELECT USING (is_active = true);
CREATE POLICY "reflections_own" ON reflections FOR INSERT USING (auth.uid() = user_id);
CREATE POLICY "reflections_own_update" ON reflections FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- RESPUESTAS A REFLEXIONES
-- =============================================
CREATE TABLE reflection_replies (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reflection_id UUID REFERENCES reflections(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content       TEXT NOT NULL CHECK (char_length(content) <= 280),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reflection_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "replies_read" ON reflection_replies FOR SELECT USING (true);
CREATE POLICY "replies_insert" ON reflection_replies FOR INSERT USING (auth.uid() = user_id);

-- =============================================
-- REFLEXIONES GUARDADAS
-- =============================================
CREATE TABLE reflection_saves (
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reflection_id UUID REFERENCES reflections(id) ON DELETE CASCADE,
  saved_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, reflection_id)
);

ALTER TABLE reflection_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saves_own" ON reflection_saves FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- PROYECTOS NGO (MAKERS-ONG)
-- =============================================
CREATE TABLE ngo_projects (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  subtitle         TEXT,
  location         TEXT,
  description      TEXT,
  target_amount    DECIMAL(10,2) NOT NULL,
  collected_amount DECIMAL(10,2) DEFAULT 0,
  month            DATE NOT NULL,  -- primer día del mes
  is_active        BOOLEAN DEFAULT false,
  image_url        TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ngo_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ngo_read" ON ngo_projects FOR SELECT USING (true);

-- Proyecto inicial
INSERT INTO ngo_projects (title, subtitle, location, target_amount, collected_amount, month, is_active)
VALUES ('Escuela rural en Senegal', 'Educación primaria en zona rural', 'Senegal, África',
        6200.00, 4240.00, DATE_TRUNC('month', NOW()), true);

-- =============================================
-- SUSCRIPCIONES
-- =============================================
CREATE TABLE subscriptions (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  level                  SMALLINT DEFAULT 1,
  price_monthly          DECIMAL(8,2) DEFAULT 29.00,
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  status                 TEXT DEFAULT 'active' CHECK (status IN ('active','paused','cancelled','trialing')),
  current_period_end     TIMESTAMPTZ,
  ngo_project_id         UUID REFERENCES ngo_projects(id),
  started_at             TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at           TIMESTAMPTZ
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_own" ON subscriptions FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- NOTIFICACIONES
-- =============================================
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN (
                'new_match','connection_request','connection_accepted',
                'reflection_reply','mentor_response','system')),
  title       TEXT NOT NULL,
  body        TEXT,
  is_read     BOOLEAN DEFAULT false,
  related_id  UUID,   -- ID del match, request, reflexión, etc.
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_own" ON notifications FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- MENSAJES SISI (historial de chat)
-- =============================================
CREATE TABLE sisi_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sisi_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sisi_own" ON sisi_messages FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- INVITACIONES
-- =============================================
CREATE TABLE invitations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invited_by       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_email    TEXT NOT NULL,
  invitee_name     TEXT,
  invitee_phone    TEXT,
  group_hint       TEXT,  -- grupo sugerido
  company_role     TEXT,
  personal_message TEXT,
  token            TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status           TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  accepted_at      TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invitations_own" ON invitations FOR ALL USING (auth.uid() = invited_by);

-- =============================================
-- FUNCIONES Y TRIGGERS
-- =============================================

-- Trigger: crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url, lang)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'lang', 'es')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Función: calcular score de match entre dos usuarios
CREATE OR REPLACE FUNCTION calculate_match_score(user_a UUID, user_b UUID)
RETURNS SMALLINT LANGUAGE plpgsql AS $$
DECLARE
  score INT := 0;
  a profiles%ROWTYPE;
  b profiles%ROWTYPE;
  shared_groups INT;
BEGIN
  SELECT * INTO a FROM profiles WHERE id = user_a;
  SELECT * INTO b FROM profiles WHERE id = user_b;

  -- Compatibilidad de intereses vs ofertas (40 pts max)
  SELECT COUNT(*) INTO shared_groups
  FROM unnest(a.synergy_interests) AS ai
  INNER JOIN unnest(b.offerings) AS bo ON ai = bo;
  score := score + LEAST(shared_groups * 10, 40);

  -- Grupos compartidos (20 pts max)
  SELECT COUNT(*) INTO shared_groups
  FROM user_groups uga
  INNER JOIN user_groups ugb ON uga.group_id = ugb.group_id
  WHERE uga.user_id = user_a AND ugb.user_id = user_b;
  score := score + LEAST(shared_groups * 10, 20);

  -- Compatibilidad de tickets (20 pts max)
  IF a.deal_ticket_min = b.deal_ticket_min OR a.deal_ticket_max = b.deal_ticket_max THEN
    score := score + 20;
  END IF;

  -- Sectores complementarios no idénticos (10 pts)
  IF a.sector != b.sector AND a.sector IS NOT NULL AND b.sector IS NOT NULL THEN
    score := score + 10;
  END IF;

  -- Roles complementarios (10 pts)
  IF ('proveedor' = ANY(a.usual_roles) AND 'cliente' = ANY(b.usual_roles))
  OR ('cliente' = ANY(a.usual_roles) AND 'proveedor' = ANY(b.usual_roles))
  OR ('inversor' = ANY(b.usual_roles) AND 'busca_inversion' = ANY(a.usual_roles))
  OR ('inversor' = ANY(a.usual_roles) AND 'busca_inversion' = ANY(b.usual_roles)) THEN
    score := score + 10;
  END IF;

  RETURN LEAST(score + 50, 100)::SMALLINT; -- base mínima 50
END;
$$;

-- Función: actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER synergies_updated_at BEFORE UPDATE ON synergies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Vista: pulse semanal del usuario
CREATE OR REPLACE VIEW user_weekly_pulse AS
SELECT
  p.id AS user_id,
  COUNT(DISTINCT m.id) FILTER (WHERE m.status IN ('pending','proposed')) AS matches_count,
  COUNT(DISTINCT cr.id) FILTER (WHERE cr.status = 'pending' AND cr.created_at > NOW()-'7 days'::INTERVAL) AS open_requests,
  COUNT(DISTINCT c.id) AS network_count
FROM profiles p
LEFT JOIN matches m ON (m.user_id_a = p.id OR m.user_id_b = p.id) AND m.expires_at > NOW()
LEFT JOIN connection_requests cr ON (cr.from_user_id = p.id OR cr.to_user_id = p.id)
LEFT JOIN connections c ON (c.user_id_a = p.id OR c.user_id_b = p.id)
GROUP BY p.id;
```

---

## API ROUTES

### `/api/sisi` (POST)
```typescript
// Recibe: { message: string, conversationHistory: Message[] }
// Llama a Claude API con contexto del usuario
// System prompt incluye: perfil del usuario, sus buscos/ofrezcos activos, sus top matches
// Guarda mensaje en sisi_messages
// Devuelve: { reply: string }
```

### `/api/synergies` (GET / POST / DELETE)
```typescript
// GET: lista buscos+ofrezcos del usuario autenticado
// POST: crea nueva sinergia { type, description, categories, budget_range }
// DELETE: desactiva sinergia por ID
// Tras POST: llamar Edge Function para recalcular matches
```

### `/api/matches` (GET)
```typescript
// GET: devuelve matches del usuario ordenados por score desc
// Aplica filtro de nivel: matches con requires_level > user.access_level → devolver con data borrosa y locked=true
```

### `/api/connections` (GET / POST)
```typescript
// GET: lista de conexiones establecidas del usuario
// POST { to_user_id, match_id, message }: crea connection_request
//   → si ya existe un request inverso pendiente → marcar ambos accepted → crear connection
//   → si no → notificar al otro usuario
```

### `/api/connections/[id]/respond` (POST)
```typescript
// POST { accepted: boolean }: responder a una solicitud de conexión
// Si accepted=true y hay request inverso → crear connection, notificar ambos
// Si accepted=false → marcar declined, NO notificar al solicitante del rechazo (privacidad)
```

### `/api/reflections` (GET / POST)
```typescript
// GET: lista de reflexiones activas paginadas, con flag de si el usuario las ha guardado
// POST { content }: crea nueva reflexión
```

### `/api/invitations` (POST)
```typescript
// POST { invitee_email, invitee_name, ... }: crea invitation + envía email via Resend/Supabase
```

### `/api/stripe/create-checkout` (POST)
```typescript
// POST { level }: crea Stripe Checkout Session para upgrade de nivel
// Precios: Nivel 2 = 59€/mes, Nivel 3 = invitation only
```

### `/api/stripe/webhook` (POST)
```typescript
// Webhook de Stripe para: checkout.session.completed, invoice.paid, customer.subscription.deleted
// Actualiza subscriptions y profiles.access_level en Supabase
```

---

## VARIABLES DE ENTORNO

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic (SISI)
ANTHROPIC_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# App
NEXT_PUBLIC_APP_URL=https://synergy.vercel.app
```

---

## TOKENS DE COLOR (globals.css)

Extraer del HTML y poner en `:root`:
```css
:root {
  --tl: #1A4731;
  --tl2: #2F7A5A;
  --tlx: #D6E8DE;
  --gd: #B8922E;
  --gdl: #E5CE82;
  --gdd: #7A5E16;
  --ink: #100E0B;
  --sft: #5A5149;
  --mut: #857870;
  --crd: #E5DDD5;
  --bdr: #D4C8B8;
  --pbg: #ECE5DD;
  --white: #FFFFFF;
  --match-high: #2F7A5A;
  --match-med: #B8922E;
  --match-low: #C8703A;
}
```

---

## INTERNACIONALIZACIÓN (ES/EN)

Usar `next-intl`. Estructura del objeto de traducciones igual al `I18N` del HTML (claves `es` y `en` con todas las labels del HTML). Toggle en header y en splash. Guardar preferencia en `profiles.lang` y `localStorage`.

---

## NOTAS DE IMPLEMENTACIÓN IMPORTANTES

1. **Privacidad en rechazos:** Cuando un usuario rechaza una solicitud de conexión, el solicitante NO recibe notificación de rechazo. Solo ve el estado "Esperando..." indefinidamente hasta que expire.

2. **Matches VIP bloqueados:** Los matches con `requires_level = 3` deben llegar al frontend con nombre y empresa borrados (reemplazar por `███`) y un campo `is_locked: true`. El frontend aplica `filter: blur(3.5px)` y muestra el candado 🔒.

3. **SISI tiene contexto real:** El sistema prompt de Claude debe incluir en tiempo real: nombre del usuario, su empresa, sus buscos y ofrezcos activos, sus top 3 matches pendientes, y su nivel de acceso. Esto hace que SISI parezca que "conoce" al usuario.

4. **Modo móvil nativo:** El shell `/(app)/layout.tsx` debe usar `height: 100dvh` y `overflow: hidden` para simular una app nativa. El scroll solo ocurre dentro de cada pantalla.

5. **Realtime de Supabase:** Suscribirse al canal `notifications` del usuario para mostrar badge en bottom nav cuando lleguen nuevos matches o solicitudes.

6. **Vercel deployment:** Incluir `vercel.json` con rewrites para el webhook de Stripe. Todas las Edge Functions de Supabase se despliegan separadas con `supabase functions deploy`.