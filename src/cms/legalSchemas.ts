import type { PageSchema } from "./schemas";

// Shared schema for legal pages. Each page has a hero section and a body
// section with rich text (markdown-lite: ## heading, blank-line paragraphs,
// "- " bullets). Spanish defaults adapted to LSSI-CE, GDPR/LOPDGDD and
// RGPD cookie guidelines (AEPD). Company-specific fields are placeholders
// the admin should fill in via the CMS.

const COMPANY_FIELDS = {
  companyName: { kind: "text", label: "Razón social", placeholder: "Asociación KLEFF" },
  companyId: { kind: "text", label: "NIF / CIF", placeholder: "G-00000000" },
  companyAddress: { kind: "text", label: "Domicilio social", placeholder: "C/ Ejemplo 1, 08000 Barcelona" },
  companyEmail: { kind: "text", label: "Email de contacto", placeholder: "hola@kleff.es" },
  companyRegistry: { kind: "text", label: "Datos registrales (opcional)", placeholder: "Inscrita en el Registro de Asociaciones de la Generalitat de Catalunya, nº ..." },
} as const;

const COMPANY_DEFAULTS = {
  companyName: "Asociación KLEFF",
  companyId: "[CIF pendiente]",
  companyAddress: "L'Estació – Espai Gastronòmic, Barcelona",
  companyEmail: "hola@kleff.es",
  companyRegistry: "",
};

export const legalNoticeSchema: PageSchema = {
  key: "legal-notice",
  label: "Aviso Legal",
  path: "/aviso-legal",
  description: "Aviso legal conforme a la Ley 34/2002 (LSSI-CE). Edita los datos identificativos del titular y el cuerpo del texto.",
  sections: [
    {
      key: "legal-notice.hero",
      label: "Cabecera",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        title: { kind: "text", label: "Título" },
        lastUpdated: { kind: "text", label: "Última actualización", placeholder: "19 de mayo de 2026" },
        ...COMPANY_FIELDS,
      },
      defaults: {
        eyebrow: "Información legal",
        title: "Aviso Legal",
        lastUpdated: "Mayo de 2026",
        ...COMPANY_DEFAULTS,
      },
    },
    {
      key: "legal-notice.content",
      label: "Cuerpo del aviso legal",
      description:
        "Texto principal. Usa `## Título` para encabezados, líneas en blanco para separar párrafos y `- ` para listas.",
      fields: {
        body: { kind: "textarea", label: "Contenido", rows: 24 },
      },
      defaults: {
        body:
`## 1. Datos identificativos del titular

En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se facilitan los siguientes datos:

- Titular: el indicado en la cabecera de esta página.
- NIF / CIF: el indicado en la cabecera.
- Domicilio: el indicado en la cabecera.
- Correo electrónico de contacto: el indicado en la cabecera.
- Sitio web: https://kleff.es

## 2. Objeto

El presente Aviso Legal regula el acceso y uso del sitio web https://kleff.es (en adelante, "el Sitio Web"). El simple acceso al Sitio Web atribuye la condición de usuario e implica la aceptación plena y sin reservas de todas las disposiciones incluidas en este Aviso Legal.

## 3. Condiciones de uso

El usuario se compromete a hacer un uso adecuado de los contenidos y servicios del Sitio Web y a no emplearlos para incurrir en actividades ilícitas, dañinas o lesivas para los derechos e intereses de terceros, o que de cualquier forma puedan dañar, inutilizar, sobrecargar o deteriorar el Sitio Web o impedir su normal uso.

## 4. Propiedad intelectual e industrial

Todos los contenidos del Sitio Web (textos, fotografías, gráficos, imágenes, iconos, tecnología, software, enlaces y demás contenidos audiovisuales o sonoros, así como su diseño gráfico y códigos fuente) son propiedad intelectual del titular o de terceros que han autorizado su uso, sin que puedan entenderse cedidos al usuario ninguno de los derechos de explotación.

Las marcas, nombres comerciales o signos distintivos son titularidad del titular o de terceros, sin que el acceso al Sitio Web atribuya ningún derecho sobre los mismos.

## 5. Exclusión de garantías y responsabilidad

El titular no se hace responsable, en ningún caso, de los daños y perjuicios de cualquier naturaleza que pudieran ocasionar, a título enunciativo: errores u omisiones en los contenidos, falta de disponibilidad del Sitio Web o la transmisión de virus o programas maliciosos en los contenidos, a pesar de haber adoptado todas las medidas tecnológicas necesarias para evitarlo.

## 6. Enlaces

En el caso de que en el Sitio Web se incluyesen enlaces a otros sitios de Internet, el titular no ejercerá ningún tipo de control sobre dichos sitios y contenidos. En ningún caso asumirá responsabilidad alguna por los contenidos de un enlace, ni garantizará la disponibilidad técnica, calidad, fiabilidad o exactitud de los mismos.

## 7. Modificaciones

El titular se reserva el derecho de efectuar sin previo aviso las modificaciones que considere oportunas en su Sitio Web, pudiendo cambiar, suprimir o añadir tanto los contenidos y servicios que se presten a través de la misma como la forma en la que estos aparezcan presentados o localizados.

## 8. Legislación aplicable y jurisdicción

La relación entre el titular y el usuario se regirá por la normativa española vigente. Para la resolución de cualquier controversia que pudiera surgir, las partes se someten a los Juzgados y Tribunales de Barcelona, salvo que la legislación aplicable disponga otra cosa.`,
      },
    },
  ],
};

export const privacySchema: PageSchema = {
  key: "privacy",
  label: "Política de Privacidad",
  path: "/privacidad",
  description: "Política de privacidad conforme al RGPD (UE) 2016/679 y la LOPDGDD.",
  sections: [
    {
      key: "privacy.hero",
      label: "Cabecera",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        title: { kind: "text", label: "Título" },
        lastUpdated: { kind: "text", label: "Última actualización" },
        ...COMPANY_FIELDS,
      },
      defaults: {
        eyebrow: "Tus datos",
        title: "Política de Privacidad",
        lastUpdated: "Mayo de 2026",
        ...COMPANY_DEFAULTS,
      },
    },
    {
      key: "privacy.content",
      label: "Cuerpo de la política de privacidad",
      fields: {
        body: { kind: "textarea", label: "Contenido", rows: 30 },
      },
      defaults: {
        body:
`## 1. Responsable del tratamiento

El responsable del tratamiento de tus datos personales es la entidad identificada en la cabecera de esta página, con domicilio y correo de contacto allí indicados.

## 2. Datos que tratamos

Tratamos los datos personales que nos facilitas voluntariamente, principalmente:

- Datos identificativos y de contacto: nombre, apellidos, correo electrónico, teléfono.
- Datos de cuenta si te registras: nombre, email, contraseña cifrada, avatar opcional.
- Datos derivados del uso de la web: páginas visitadas, dispositivo, dirección IP (siempre que hayas dado tu consentimiento para cookies analíticas).
- Comunicaciones que nos envíes a través del formulario de contacto o por correo electrónico.

## 3. Finalidades y base legal

Tratamos tus datos para las siguientes finalidades:

- Gestionar tu participación en eventos, partidas y comunidad de KLEFF (ejecución de un contrato o relación asociativa).
- Atender consultas enviadas a través del formulario o por email (consentimiento e interés legítimo).
- Gestionar tu cuenta de usuario y reservas (ejecución del contrato).
- Enviar comunicaciones informativas sobre actividades (consentimiento, revocable en cualquier momento).
- Cumplir obligaciones legales aplicables.
- Mejorar la web mediante estadísticas anonimizadas (consentimiento, gestionable desde "Preferencias de cookies").

## 4. Conservación de los datos

Conservaremos tus datos durante el tiempo necesario para cumplir las finalidades para las que se recogieron y, en su caso, durante los plazos legalmente exigibles. Cuando ya no sean necesarios, se suprimirán con medidas de seguridad adecuadas.

## 5. Destinatarios

Tus datos no se ceden a terceros salvo obligación legal. Utilizamos proveedores tecnológicos que actúan como encargados del tratamiento (alojamiento, correo electrónico, herramientas analíticas), siempre con las garantías exigidas por el RGPD. Algunos de ellos pueden estar ubicados fuera del EEE, en cuyo caso se aplican las cláusulas contractuales tipo aprobadas por la Comisión Europea.

## 6. Tus derechos

Como interesado, puedes ejercer en cualquier momento los siguientes derechos:

- Acceso a tus datos personales.
- Rectificación de datos inexactos.
- Supresión ("derecho al olvido").
- Limitación del tratamiento.
- Portabilidad de los datos.
- Oposición al tratamiento.
- Retirada del consentimiento prestado, sin que ello afecte a la licitud del tratamiento previo.

Para ejercerlos, escríbenos al correo de contacto indicado en la cabecera, adjuntando copia de un documento que acredite tu identidad. Si consideras que el tratamiento no se ajusta a la normativa, puedes presentar una reclamación ante la Agencia Española de Protección de Datos (https://www.aepd.es).

## 7. Seguridad

Aplicamos medidas técnicas y organizativas apropiadas para garantizar la seguridad de los datos personales y evitar su alteración, pérdida o tratamiento no autorizado, teniendo en cuenta el estado de la tecnología y la naturaleza de los datos.

## 8. Cambios en la política

Esta política puede actualizarse para adaptarse a cambios normativos o de la actividad de KLEFF. Te recomendamos revisarla periódicamente. La fecha de la última actualización figura en la cabecera.`,
      },
    },
  ],
};

export const cookiesSchema: PageSchema = {
  key: "cookies",
  label: "Política de Cookies",
  path: "/cookies",
  description: "Política de cookies según la Guía de la AEPD. Edita la lista de cookies utilizadas y el texto explicativo.",
  sections: [
    {
      key: "cookies.hero",
      label: "Cabecera",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        title: { kind: "text", label: "Título" },
        lastUpdated: { kind: "text", label: "Última actualización" },
      },
      defaults: {
        eyebrow: "Cookies",
        title: "Política de Cookies",
        lastUpdated: "Mayo de 2026",
      },
    },
    {
      key: "cookies.content",
      label: "Texto explicativo",
      fields: {
        body: { kind: "textarea", label: "Contenido", rows: 24 },
      },
      defaults: {
        body:
`## 1. ¿Qué son las cookies?

Las cookies son pequeños archivos de texto que los sitios web almacenan en el navegador del usuario para guardar información sobre la visita. Sirven, entre otras cosas, para reconocerte como usuario, conocer tus preferencias o medir el uso de la web.

## 2. Tipos de cookies que utilizamos

Conforme a la normativa, agrupamos las cookies en tres categorías:

- Cookies estrictamente necesarias: imprescindibles para el funcionamiento del sitio (sesión, seguridad, recordar tus preferencias de cookies). No requieren consentimiento.
- Cookies analíticas: nos permiten medir de forma agregada y anonimizada cómo se usa la web para mejorarla. Solo se activan si las aceptas.
- Cookies de marketing: se utilizan para mostrar contenidos o publicidad relevantes en sitios de terceros. Solo se activan si las aceptas.

## 3. Gestión del consentimiento

La primera vez que visitas la web te mostramos un banner donde puedes aceptar todas, rechazar todas o configurar las cookies por categoría. Puedes cambiar tu elección en cualquier momento desde el enlace "Preferencias de cookies" del pie de página.

## 4. Cookies de terceros

Si aceptas cookies analíticas o de marketing, se pueden activar cookies de servicios externos. Cada uno de estos servicios mantiene su propia política de privacidad y cookies.

## 5. Cómo desactivar las cookies desde el navegador

Además del configurador de la web, puedes bloquear o eliminar las cookies desde la configuración de tu navegador. Ten en cuenta que desactivar las cookies estrictamente necesarias puede afectar al funcionamiento del sitio.

## 6. Actualizaciones

Esta política puede actualizarse para reflejar cambios en las cookies utilizadas o en la normativa aplicable. La fecha de la última actualización figura en la cabecera.`,
      },
    },
    {
      key: "cookies.inventory",
      label: "Listado de cookies",
      description: "Inventario que se muestra debajo del texto. Añade o quita cookies según uses.",
      fields: {
        title: { kind: "text", label: "Título de la tabla" },
        items: {
          kind: "list",
          label: "Cookies",
          itemLabel: "Cookie",
          fields: {
            name: { kind: "text", label: "Nombre" },
            provider: { kind: "text", label: "Proveedor / dominio" },
            category: { kind: "text", label: "Categoría (necesaria / analítica / marketing)" },
            purpose: { kind: "textarea", label: "Finalidad", rows: 2 },
            duration: { kind: "text", label: "Duración" },
          },
        },
      },
      defaults: {
        title: "Cookies que utilizamos",
        items: [
          { name: "kleff-cookie-consent", provider: "kleff.es", category: "necesaria", purpose: "Almacena tus preferencias de cookies para no volver a preguntarte en cada visita.", duration: "12 meses" },
          { name: "sb-access-token / sb-refresh-token", provider: "kleff.es", category: "necesaria", purpose: "Sesión de usuario autenticado (área privada y reservas).", duration: "Sesión / 30 días" },
        ],
      },
    },
  ],
};

export const termsSchema: PageSchema = {
  key: "terms",
  label: "Términos y Condiciones",
  path: "/terminos",
  description: "Términos y condiciones de uso del sitio web y de los servicios de KLEFF.",
  sections: [
    {
      key: "terms.hero",
      label: "Cabecera",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        title: { kind: "text", label: "Título" },
        lastUpdated: { kind: "text", label: "Última actualización" },
        ...COMPANY_FIELDS,
      },
      defaults: {
        eyebrow: "Condiciones",
        title: "Términos y Condiciones",
        lastUpdated: "Mayo de 2026",
        ...COMPANY_DEFAULTS,
      },
    },
    {
      key: "terms.content",
      label: "Cuerpo de los términos",
      fields: {
        body: { kind: "textarea", label: "Contenido", rows: 30 },
      },
      defaults: {
        body:
`## 1. Aceptación

El uso del sitio web https://kleff.es y de los servicios ofrecidos por KLEFF (eventos, ludoteca, comunidades, reservas, etc.) implica la aceptación de los presentes Términos y Condiciones, así como del Aviso Legal y la Política de Privacidad.

## 2. Servicios

KLEFF organiza actividades comunitarias en torno a los juegos de mesa: noches de juegos, torneos, comunidades temáticas, eventos especiales y, en su caso, alquiler de juegos. Los detalles, horarios y condiciones de cada actividad se publican en la web y/o en los canales oficiales de KLEFF.

## 3. Registro y cuenta de usuario

Algunas funcionalidades requieren registrarse. El usuario se compromete a facilitar datos veraces y a mantener la confidencialidad de sus credenciales. KLEFF puede suspender o eliminar cuentas que incumplan estos Términos o realicen un uso fraudulento.

## 4. Normas de convivencia

KLEFF es una comunidad inclusiva, multilingüe y respetuosa. No se tolerarán comportamientos discriminatorios, violentos o que vulneren los derechos de otras personas. El incumplimiento puede suponer la expulsión del local y/o la cancelación de la cuenta.

## 5. Reservas y alquiler de juegos

Cuando una actividad o servicio requiera reserva (por ejemplo, alquiler de un juego), aplicarán las condiciones específicas indicadas en su página y/o en la confirmación de reserva. El usuario es responsable del cuidado y devolución del material en las mismas condiciones en que se entregó.

## 6. Precios y consumiciones

La participación en muchas actividades es gratuita previa consumición mínima en el local colaborador, conforme se indique en cada actividad. Los precios y condiciones pueden variar y se publicarán siempre con antelación.

## 7. Propiedad intelectual

Los contenidos de la web pertenecen a sus respectivos titulares. El usuario no puede reproducir, distribuir ni transformar dichos contenidos sin autorización expresa.

## 8. Limitación de responsabilidad

KLEFF no se hace responsable de los daños derivados del uso indebido del sitio o de los servicios, ni de los contenidos publicados por terceros. La participación en actividades presenciales se realiza bajo la responsabilidad del asistente, sin perjuicio de la diligencia de KLEFF en la organización.

## 9. Modificaciones

KLEFF puede actualizar estos Términos para adaptarlos a cambios legislativos o de la actividad. Se publicará la fecha de la última actualización en la cabecera.

## 10. Legislación y jurisdicción

Estos Términos se rigen por la legislación española. Las partes se someten a los Juzgados y Tribunales de Barcelona, salvo que la normativa aplicable disponga otra cosa.`,
      },
    },
  ],
};

export const LEGAL_SCHEMAS: PageSchema[] = [
  legalNoticeSchema,
  privacySchema,
  cookiesSchema,
  termsSchema,
];
