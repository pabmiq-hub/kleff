## Diagnóstico

El blog ha dejado de funcionar tanto en la web pública como en el panel de administrador. Las dos pantallas que ves provienen de la **misma causa raíz**:

- **`/blog` (público)** → SSR devuelve HTTP 500 con el error `Cannot read properties of undefined (reading 'bind')`. Esto se dispara dentro del `loader` de `src/routes/blog.tsx` cuando llama a `listBlogPosts({ data: { locale: "es" } })`.
- **`/admin/blog` (admin)** → en cliente, `await listFn()` resuelve a `undefined`, y al hacer `setPosts(res.posts)` salta `Cannot read properties of undefined (reading 'posts')`.

El denominador común es la definición del server function en `src/lib/blog.functions.ts`:

```ts
export const listBlogPosts = createServerFn({ method: "GET" })
  .inputValidator(z.object({ locale: localeSchema.default("es") }))
  .handler(...)
```

Se está pasando un **schema de Zod directamente** a `.inputValidator(...)`. El runtime actual de TanStack Start intenta invocar internamente un método (`.bind(...)`) sobre el validador asumiendo una determinada forma, y como el schema no la expone tal cual, falla con el mensaje `Cannot read properties of undefined (reading 'bind')`. El error se lanza **antes** de ejecutar el handler, por lo que el endpoint nunca devuelve datos y el cliente recibe `undefined`.

`/medios` y `listMediaAppearances` no se ven afectados porque ese server function **no tiene `inputValidator`** y se llama sin argumentos.

## Cambios

### 1. `src/lib/blog.functions.ts` — envolver todos los `inputValidator` en una función

Cambiar el patrón en TODOS los server functions del archivo:

```ts
// Antes
.inputValidator(z.object({ locale: localeSchema.default("es") }))

// Después
.inputValidator((data: unknown) =>
  z.object({ locale: localeSchema.default("es") }).parse(data)
)
```

Aplicar el mismo wrapping a:
- `listBlogPosts`
- `getBlogPostBySlug`
- `adminImportWordPress`
- `adminTranslateBlogPost`
- `adminGetBlogPost`
- `adminCreateBlogPost`
- `adminUpdateBlogPost`
- `adminDeleteBlogPost`

Esto es el patrón canónico recomendado por TanStack Start y es compatible en todas las versiones.

### 2. `src/lib/media-appearances.functions.ts` — mismo wrapping preventivo

Aunque por ahora ninguna llamada falla, aplicar el mismo patrón en:
- `adminGetMediaAppearance`
- `adminCreateMediaAppearance`
- `adminUpdateMediaAppearance`
- `adminDeleteMediaAppearance`

Para evitar que el problema reaparezca al editar/borrar medios.

### 3. Verificación

- Recargar `/blog`, `/ca/blog`, `/en/blog`: deben renderizar la lista sin error 500.
- Recargar `/admin/blog`: debe listar los posts existentes.
- Abrir un post desde el admin (`/admin/blog/$id`) para confirmar que `adminGetBlogPost` también funciona.
- Probar guardar un cambio en un post (`adminUpdateBlogPost`).
- Confirmar en los Server Logs publicados que `/blog` deja de devolver 500.

## Notas

- No hace falta tocar la base de datos: los posts siguen intactos.
- No hace falta tocar el `loader` de las rutas ni los componentes — el problema está exclusivamente en cómo se declaran los validadores de entrada.
- El cambio es puramente defensivo y mantiene la misma validación con Zod.