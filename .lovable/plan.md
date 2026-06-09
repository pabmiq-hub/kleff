# Por qué sigues viendo WordPress

En Lovable el dominio está **Active** y los registros **A** ya apuntan correctamente a `185.158.133.1` (Lovable). El problema está en otros registros que conviven en la zona DNS de Hostinger y que **se resuelven antes** que los A en muchos clientes:

- `AAAA  @   → 2a02:4780:3f:1799:0:9ca:7d01:3` ← este es el servidor antiguo de Hostinger (WordPress) por IPv6
- `AAAA  new → 2a02:4780:3f:1799:0:9ca:7d01:3` ← subdominio antiguo apuntando a Hostinger

Cualquier visitante con conectividad IPv6 (la mayoría de móviles y muchas redes domésticas) usa el `AAAA` antes que el `A`, así que sigue cayendo en WordPress aunque el `A` esté perfecto. Hasta que ese AAAA no desaparezca, una parte del tráfico verá el WordPress viejo.

# Pasos en Hostinger (panel DNS donde sacaste las capturas)

1. **Borrar** la fila:
   - Tipo `AAAA`, Nombre `@`, Contenido `2a02:4780:3f:1799:0:9ca:7d01:3` → botón **Borrar**.
2. **Borrar** la fila:
   - Tipo `AAAA`, Nombre `new`, Contenido `2a02:4780:3f:1799:0:9ca:7d01:3` → **Borrar**.
   (También puedes borrar el `A new → 92.113.19.78` si ese subdominio ya no se usa; no afecta a kleff.es / www, pero queda más limpio.)
3. **Comprobar** que se quedan estos registros tal cual (NO los toques):
   - `A    @    185.158.133.1`
   - `A    www  185.158.133.1`
   - `TXT  _lovable      lovable_verify=026cb7ff...`
   - `TXT  _lovable.www  lovable_verify=67cc74e2...`
4. **Dejar en paz** todo lo de correo (MX, SPF, DKIM `resend._domainkey`, `hostingermail-*._domainkey`, `_dmarc`, `autodiscover`, `autoconfig`, `send`). Eso es el email de Hostinger y no afecta a la web.

# Después de borrar los AAAA

- La propagación suele ser de minutos a unas pocas horas (TTL de los AAAA era 1800 s = 30 min).
- Verifica desde una pestaña de incógnito (para evitar caché del navegador) entrando a `https://kleff.es` y `https://www.kleff.es`.
- Si quieres confirmar antes de probar en navegador, en una terminal:
  ```
  dig kleff.es A +short      → debe devolver 185.158.133.1
  dig kleff.es AAAA +short   → debe devolver vacío
  dig www.kleff.es A +short  → debe devolver 185.158.133.1
  dig www.kleff.es AAAA +short → debe devolver vacío
  ```
- Si tu router/operador tiene caché DNS agresiva, reinicia el router o cambia temporalmente tu DNS a `1.1.1.1` para forzar resolución limpia.

# Si después de ~1 hora sigues viendo WordPress

Avísame y miramos: (a) que no haya un Service Worker viejo del WordPress cacheado en tu navegador (DevTools → Application → Service Workers → Unregister, y borrar caché del sitio), y (b) el estado del dominio en Project Settings → Domains por si hubiera que reemitir el SSL.

# Detalles técnicos (referencia)

- Orden de preferencia del cliente: si hay AAAA y el cliente tiene IPv6, gana AAAA (RFC 6724). Por eso el `A` correcto no es suficiente mientras exista un AAAA apuntando a otro sitio.
- Los registros `_lovable` y `_lovable.www` ya están bien y son los que Lovable usa para verificar ownership y emitir el certificado.
