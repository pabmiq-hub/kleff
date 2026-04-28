# Plan – Fase 1: Plataforma privada de KLEFF

Construimos los **cimientos** de la zona privada sin tocar la web informativa actual. Las fases siguientes (carnet, alquiler con BGG, CMS tipo WP+Elementor, importación de blog WordPress) se planificarán por separado al final de esta fase.

---

## 1. Qué entregamos en esta iteración

1. **Lovable Cloud activado** (necesario para auth, base de datos y envío de emails).
2. **Sistema de autenticación**:
   - Login con email/username + contraseña.
   - Dos roles: `super_admin` y `user` (tabla `user_roles` separada, con `has_role()` security definer — patrón seguro contra escalado de privilegios).
   - El primer super admin se crea manualmente (te explico cómo darte el rol tras el primer registro).
3. **Sistema de invitaciones por email**:
   - Solo el super admin puede invitar.
   - Se genera un token único, se envía email con enlace de registro (`/invite/:token`).
   - El token caduca a los 7 días y es de un solo uso.
4. **Registro vía invitación** con formulario de perfil:
   - Username (único), nombre completo, foto de perfil (upload a Storage), fecha de nacimiento, **número de documento de identidad** (sensible), género (lista + opción "prefiero no decirlo" / "otro").
5. **Panel privado del usuario** (`/app`): estructura base con header propio, navegación lateral, página "Mi perfil" funcional. Placeholders para Carnet y Alquiler.
6. **Panel del super admin** (`/app/admin`): listado de usuarios, formulario de invitación, ver/revocar invitaciones pendientes, ver detalles de cada usuario (incluido el DNI, que solo él ve).

La web pública actual (`/`, `/about`, `/how-it-works`, `/media`, `/blog`, `/contact` en es/en/ca) sigue intacta.

---

## 2. Estructura de rutas

```text
/                              → web pública (sin cambios)
/about, /how-it-works, ...     → web pública (sin cambios)

/login                         → login (público)
/invite/$token                 → aceptar invitación + crear cuenta + perfil

/app                           → layout protegido (requiere sesión)
  /app/                        → dashboard del usuario
  /app/profile                 → editar perfil propio
  /app/carnet                  → placeholder "Próximamente"
  /app/rentals                 → placeholder "Próximamente"

/app/admin                     → layout protegido (requiere super_admin)
  /app/admin/                  → resumen
  /app/admin/users             → listado y detalle de usuarios
  /app/admin/invitations       → invitar / revocar
```

Las rutas `/app/*` usan el patrón TanStack `_authenticated` (layout con `beforeLoad` que redirige a `/login`). Las rutas `/app/admin/*` añaden un segundo guard que comprueba el rol.

---

## 3. Modelo de datos (Supabase / Lovable Cloud)

```text
auth.users                       (gestionado por Supabase)

public.profiles
  id (uuid, PK, FK→auth.users, on delete cascade)
  username (text, unique, citext)
  full_name (text)
  avatar_url (text, nullable)
  date_of_birth (date)
  gender (text)
  id_document_encrypted (bytea)  ← cifrado con pgsodium
  created_at, updated_at

public.user_roles
  id (uuid, PK)
  user_id (uuid, FK→auth.users)
  role (app_role enum: 'super_admin' | 'user')
  unique(user_id, role)

public.invitations
  id (uuid, PK)
  email (citext)
  token_hash (text, unique)      ← solo guardamos el hash; el token va por email
  invited_by (uuid, FK→auth.users)
  expires_at (timestamptz)
  accepted_at (timestamptz, nullable)
  created_at
```

**RLS clave**:
- `profiles`: el usuario solo ve/edita su propia fila; el super admin ve todas. El `id_document_encrypted` se descifra solo en una función `security definer` `get_user_id_document(user_id)` que comprueba `has_role(auth.uid(), 'super_admin')`.
- `user_roles`: lectura solo a través de `has_role()`. Solo super admin inserta/borra.
- `invitations`: solo super admin lee/escribe. La aceptación se hace vía server function pública que valida el token.

**Storage**: bucket `avatars` (público en lectura, escritura solo del propio usuario).

---

## 4. Tratamiento del DNI (RGPD)

- Cifrado en columna con **pgsodium** (cifrado simétrico autenticado a nivel de BD).
- **Nunca** se envía al cliente del propio usuario tras registrarse — solo el super admin puede consultarlo bajo demanda en el panel admin (la consulta queda registrada en una tabla `audit_log` para trazabilidad).
- En el formulario de registro: aviso explícito de finalidad (emisión de carnet de socio) y enlace a política de privacidad.
- Validación de formato (DNI/NIE español) en cliente y servidor con Zod.

---

## 5. Sistema de invitaciones – flujo

```text
Super admin → /app/admin/invitations
  └─ introduce email → server function:
       1. genera token aleatorio (32 bytes)
       2. guarda token_hash + expira en 7 días
       3. envía email con link https://.../invite/{token}

Invitado abre /invite/{token}
  └─ loader valida token (no usado, no caducado) → muestra formulario
  └─ submit → server function:
       1. supabase.auth.admin.createUser(email, password)
       2. inserta profile (con DNI cifrado)
       3. inserta user_roles (role='user')
       4. marca invitación como accepted_at=now()
       5. inicia sesión → redirige a /app
```

**Emails**: usaremos **Lovable Emails** (infraestructura nativa con cola pgmq y reintentos). Necesitarás configurar un dominio de envío (te lo guío con el diálogo de setup).

---

## 6. Stack técnico (detalles)

- **Auth**: Supabase Auth (email + password). Sin OAuth en esta fase.
- **Server functions** (`createServerFn`) para todas las operaciones sensibles: invitar, aceptar invitación, leer DNI, asignar roles. **Nunca** desde el cliente directamente.
- **`supabaseAdmin`** (service role) solo en server routes/functions para `createUser` y operaciones de admin.
- **Validación**: Zod en cliente y servidor para todos los formularios.
- **Foto de perfil**: upload directo a Storage con tamaño máximo 2MB y conversión client-side a webp.
- **i18n**: el panel privado se construye en español por defecto (la web pública ya tiene es/en/ca; el panel privado lo dejamos solo en `es` en esta fase para no multiplicar el trabajo — añadible más tarde).
- **Diseño**: reutilizamos los tokens y componentes shadcn ya presentes para mantener coherencia visual con la web pública. Header del panel privado distinto del público para que se note que es "zona socios".

---

## 7. Bootstrap del primer Super Admin

No podemos invitarnos a nosotros mismos (no hay aún super admin). Flujo:
1. Te registras tú normalmente con un email (creo un endpoint puntual `/dev/bootstrap-admin` protegido por una clave en variable de entorno, o lo hacemos por SQL directo en Cloud).
2. Te asigno el rol `super_admin` en `user_roles`.
3. A partir de ahí ya puedes invitar a quien quieras y el endpoint de bootstrap se elimina.

Recomiendo la vía SQL — más limpio. Te paso el comando exacto cuando lleguemos a ese paso.

---

## 8. Lo que NO entra en esta fase (siguientes iteraciones)

- 🚫 Carnet de Kleffer (diseño + generación PDF/imagen + sincronización con super admin).
- 🚫 Alquiler de juegos + sync con BoardGameGeek (colección de la cuenta KLEFF en BGG vía su API XML).
- 🚫 CMS tipo "WordPress + Elementor" para editar la parte informativa actual.
- 🚫 Importación de entradas de blog desde una cuenta WordPress preexistente conservando URLs.
- 🚫 Editor visual de páginas nuevas.

Cuando termine esta fase, prepararé un plan dedicado para la siguiente, empezando probablemente por **Carnet** (más acotado) y luego **CMS + blog WP** (más complejo, requiere decisiones sobre el editor visual).

---

## 9. Riesgos y avisos

- **Editor "tipo WordPress + Elementor"**: construir un editor visual completo es un proyecto en sí mismo (semanas de trabajo). Cuando lleguemos a esa fase propondré alternativas más realistas (p. ej. editar bloques de texto/imágenes predefinidos en cada sección, o usar un CMS headless externo como Sanity/Payload). Lo discutimos cuando toque.
- **Importación de WordPress conservando URLs**: factible vía export XML de WP + redirects. Lo planificamos en su fase.
- **DNI cifrado**: si pierdes acceso a la clave de pgsodium, los DNIs son irrecuperables. Es lo deseable por seguridad pero conviene saberlo.

---

¿Apruebas este plan para empezar a construir la Fase 1?
