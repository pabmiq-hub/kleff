import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertFinanzasRead, assertFinanzasWrite, db } from "@/lib/permissions.server";

// ---------------------------------------------------------------- tipos
export type Categoria = {
  id: string;
  nombre: string;
  tipo: "ingreso" | "gasto";
  activa: boolean;
};

export type CuotaSocio = {
  id: string | null;
  socio_id: string;
  socio_nombre: string;
  member_number: number | null;
  anio: number;
  importe: number;
  estado: "pendiente" | "pagado" | "exento";
  motivo_exencion: string | null;
  fecha_pago: string | null;
};

export type Aportacion = {
  id: string;
  fecha: string;
  importe: number;
  categoria_id: string | null;
  concepto: string | null;
  socio_id: string | null;
};

export type Factura = {
  id: string;
  numero_factura: string;
  fecha_emision: string;
  entidad_nombre: string;
  entidad_nif: string | null;
  base_imponible: number;
  porcentaje_iva: number;
  importe_iva: number;
  total: number;
  estado: "pendiente" | "cobrada";
  fecha_cobro: string | null;
  concepto: string | null;
};

export type Gasto = {
  id: string;
  fecha: string;
  importe: number;
  categoria_id: string | null;
  descripcion: string | null;
  proveedor: string | null;
  adjunto_url: string | null;
};

export type PagoImpuesto = {
  id: string;
  impuesto_previsto_id: string;
  fecha_pago: string;
  importe_pagado: number;
  referencia: string | null;
};

export type ImpuestoTrimestre = {
  id: string;
  anio: number;
  trimestre: "Q1" | "Q2" | "Q3" | "Q4";
  base_imponible_total: number;
  iva_repercutido_total: number;
  porcentaje_aplicable: number;
  importe_previsto: number;
  estado: "previsto" | "conciliado";
  pagado: number;
  pendiente: number;
  pagos: PagoImpuesto[];
};

export type CuentaColaboracion = {
  id: string;
  nombre: string;
  descripcion: string | null;
  fecha_creacion: string;
  aportado: number;
  gastado: number;
  saldo: number;
};

export type AccionColaboracion = {
  id: string;
  cuenta_colaboracion_id: string;
  fecha: string;
  tipo: "aportacion" | "gasto";
  importe: number;
  descripcion: string | null;
};

const num = (v: unknown) => Number(v ?? 0) || 0;
const quarterOf = (iso: string) => `Q${Math.floor(new Date(iso).getUTCMonth() / 3) + 1}` as const;

// ---------------------------------------------------------------- categorías
export const finListCategorias = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Categoria[]> => {
    await assertFinanzasRead(context.userId);
    const { data, error } = await db
      .from("categorias_movimiento")
      .select("*")
      .order("tipo")
      .order("nombre");
    if (error) throw new Error(error.message);
    return (data ?? []) as Categoria[];
  });

export const finUpsertCategoria = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        nombre: z.string().min(1).max(120),
        tipo: z.enum(["ingreso", "gasto"]),
        activa: z.boolean().default(true),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertFinanzasWrite(context.userId);
    const payload = { nombre: data.nombre.trim(), tipo: data.tipo, activa: data.activa };
    const { error } = data.id
      ? await db.from("categorias_movimiento").update(payload).eq("id", data.id)
      : await db.from("categorias_movimiento").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------------------------------------------------------- cuotas
export const finListCuotas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ anio: z.number().int() }).parse(d))
  .handler(async ({ data, context }): Promise<CuotaSocio[]> => {
    await assertFinanzasRead(context.userId);
    const { data: socios, error } = await db
      .from("profiles")
      .select("id, full_name, username, member_number")
      .order("member_number", { ascending: true, nullsFirst: false });
    if (error) throw new Error(error.message);

    const { data: cuotas } = await db.from("cuotas_socios").select("*").eq("anio", data.anio);
    const { data: previas } = await db
      .from("cuotas_socios")
      .select("socio_id, estado, motivo_exencion, importe")
      .eq("anio", data.anio - 1)
      .eq("estado", "exento");

    const byId = new Map<string, Record<string, unknown>>();
    for (const c of cuotas ?? []) byId.set((c as { socio_id: string }).socio_id, c);

    // Exentos automáticos: si el año anterior estaba exento, se arrastra.
    const nuevos = (previas ?? [])
      .filter((p: { socio_id: string }) => !byId.has(p.socio_id))
      .map((p: { socio_id: string; motivo_exencion: string | null; importe: number }) => ({
        socio_id: p.socio_id,
        anio: data.anio,
        importe: num(p.importe),
        estado: "exento",
        motivo_exencion: p.motivo_exencion,
      }));
    if (nuevos.length) {
      const { data: insertados } = await db.from("cuotas_socios").insert(nuevos).select("*");
      for (const c of insertados ?? []) byId.set((c as { socio_id: string }).socio_id, c);
    }

    return (socios ?? []).map((s: { id: string; full_name: string | null; username: string | null; member_number: number | null }) => {
      const c = byId.get(s.id) as Partial<CuotaSocio> | undefined;
      return {
        id: (c?.id as string) ?? null,
        socio_id: s.id,
        socio_nombre: s.full_name || s.username || "(sin nombre)",
        member_number: s.member_number,
        anio: data.anio,
        importe: num(c?.importe),
        estado: (c?.estado as CuotaSocio["estado"]) ?? "pendiente",
        motivo_exencion: (c?.motivo_exencion as string) ?? null,
        fecha_pago: (c?.fecha_pago as string) ?? null,
      };
    });
  });

export const finSetCuota = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        socio_id: z.string().uuid(),
        anio: z.number().int(),
        estado: z.enum(["pendiente", "pagado", "exento"]),
        importe: z.number().min(0).max(100000).optional(),
        motivo_exencion: z.string().max(500).nullable().optional(),
        fecha_pago: z.string().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertFinanzasWrite(context.userId);
    const row = {
      socio_id: data.socio_id,
      anio: data.anio,
      estado: data.estado,
      importe: data.importe ?? 0,
      motivo_exencion: data.estado === "exento" ? (data.motivo_exencion ?? null) : null,
      fecha_pago:
        data.estado === "pagado"
          ? (data.fecha_pago ?? new Date().toISOString().slice(0, 10))
          : null,
    };
    const { error } = await db.from("cuotas_socios").upsert(row, { onConflict: "socio_id,anio" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------------------------------------------------------- aportaciones
export const finListAportaciones = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Aportacion[]> => {
    await assertFinanzasRead(context.userId);
    const { data, error } = await db.from("aportaciones").select("*").order("fecha", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((a: Aportacion) => ({ ...a, importe: num(a.importe) }));
  });

export const finCreateAportacion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        fecha: z.string(),
        importe: z.number(),
        categoria_id: z.string().uuid().nullable().optional(),
        concepto: z.string().max(500).nullable().optional(),
        socio_id: z.string().uuid().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertFinanzasWrite(context.userId);
    const { id, ...rest } = data;
    const payload = {
      ...rest,
      categoria_id: rest.categoria_id ?? null,
      socio_id: rest.socio_id ?? null,
      concepto: rest.concepto ?? null,
    };
    const { error } = id
      ? await db.from("aportaciones").update(payload).eq("id", id)
      : await db.from("aportaciones").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const finDeleteAportacion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertFinanzasWrite(context.userId);
    const { error } = await db.from("aportaciones").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------------------------------------------------------- facturas
export const finListFacturas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Factura[]> => {
    await assertFinanzasRead(context.userId);
    const { data, error } = await db.from("facturas").select("*").order("fecha_emision", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((f: Factura) => ({
      ...f,
      base_imponible: num(f.base_imponible),
      porcentaje_iva: num(f.porcentaje_iva),
      importe_iva: num(f.importe_iva),
      total: num(f.total),
    }));
  });

export const finCreateFactura = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        fecha_emision: z.string(),
        entidad_nombre: z.string().min(1).max(200),
        entidad_nif: z.string().max(40).nullable().optional(),
        base_imponible: z.number().min(0),
        porcentaje_iva: z.number().min(0).max(100).default(21),
        concepto: z.string().max(1000).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertFinanzasWrite(context.userId);
    const { error } = await db.from("facturas").insert({
      ...data,
      entidad_nif: data.entidad_nif ?? null,
      concepto: data.concepto ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const finSetFacturaCobrada = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        cobrada: z.boolean(),
        fecha_cobro: z.string().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertFinanzasWrite(context.userId);
    const { error } = await db
      .from("facturas")
      .update({
        estado: data.cobrada ? "cobrada" : "pendiente",
        fecha_cobro: data.cobrada
          ? (data.fecha_cobro ?? new Date().toISOString().slice(0, 10))
          : null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const finDeleteFactura = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertFinanzasWrite(context.userId);
    const { error } = await db.from("facturas").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------------------------------------------------------- gastos
export const finListGastos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Gasto[]> => {
    await assertFinanzasRead(context.userId);
    const { data, error } = await db.from("gastos").select("*").order("fecha", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((g: Gasto) => ({ ...g, importe: num(g.importe) }));
  });

export const finCreateGasto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        fecha: z.string(),
        importe: z.number(),
        categoria_id: z.string().uuid().nullable().optional(),
        descripcion: z.string().max(1000).nullable().optional(),
        proveedor: z.string().max(200).nullable().optional(),
        adjunto_url: z.string().max(1000).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertFinanzasWrite(context.userId);
    const { id, ...rest } = data;
    const payload = {
      ...rest,
      categoria_id: rest.categoria_id ?? null,
      descripcion: rest.descripcion ?? null,
      proveedor: rest.proveedor ?? null,
      adjunto_url: rest.adjunto_url ?? null,
    };
    const { error } = id
      ? await db.from("gastos").update(payload).eq("id", id)
      : await db.from("gastos").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const finDeleteGasto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertFinanzasWrite(context.userId);
    const { error } = await db.from("gastos").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------------------------------------------------------- impuestos
async function recalcImpuestos(anio: number): Promise<ImpuestoTrimestre[]> {
  const { data: facturas } = await db
    .from("facturas")
    .select("fecha_emision, base_imponible, importe_iva")
    .gte("fecha_emision", `${anio}-01-01`)
    .lte("fecha_emision", `${anio}-12-31`);

  const { data: existentes } = await db.from("impuestos_previstos").select("*").eq("anio", anio);
  const byQ = new Map<string, Record<string, unknown>>();
  for (const i of existentes ?? []) byQ.set((i as { trimestre: string }).trimestre, i);

  const quarters: ImpuestoTrimestre["trimestre"][] = ["Q1", "Q2", "Q3", "Q4"];
  const rows = quarters.map((q) => {
    const fs = (facturas ?? []).filter(
      (f: { fecha_emision: string }) => quarterOf(f.fecha_emision) === q,
    );
    const base = fs.reduce((s: number, f: { base_imponible: number }) => s + num(f.base_imponible), 0);
    const iva = fs.reduce((s: number, f: { importe_iva: number }) => s + num(f.importe_iva), 0);
    const prev = byQ.get(q) as Partial<ImpuestoTrimestre> | undefined;
    const pct = num(prev?.porcentaje_aplicable) || 21;
    return {
      ...(prev?.id ? { id: prev.id } : {}),
      anio,
      trimestre: q,
      base_imponible_total: Math.round(base * 100) / 100,
      iva_repercutido_total: Math.round(iva * 100) / 100,
      porcentaje_aplicable: pct,
      importe_previsto: Math.round(iva * 100) / 100,
      estado: (prev?.estado as ImpuestoTrimestre["estado"]) ?? "previsto",
    };
  });

  const { data: saved, error } = await db
    .from("impuestos_previstos")
    .upsert(rows, { onConflict: "anio,trimestre" })
    .select("*");
  if (error) throw new Error(error.message);

  const ids = (saved ?? []).map((r: { id: string }) => r.id);
  const { data: pagos } = ids.length
    ? await db.from("pagos_impuestos").select("*").in("impuesto_previsto_id", ids)
    : { data: [] };

  return (saved ?? [])
    .map((r: ImpuestoTrimestre) => {
      const ps = (pagos ?? [])
        .filter((p: PagoImpuesto) => p.impuesto_previsto_id === r.id)
        .map((p: PagoImpuesto) => ({ ...p, importe_pagado: num(p.importe_pagado) }));
      const pagado = ps.reduce((s: number, p: PagoImpuesto) => s + p.importe_pagado, 0);
      const previsto = num(r.importe_previsto);
      return {
        ...r,
        base_imponible_total: num(r.base_imponible_total),
        iva_repercutido_total: num(r.iva_repercutido_total),
        porcentaje_aplicable: num(r.porcentaje_aplicable),
        importe_previsto: previsto,
        pagado: Math.round(pagado * 100) / 100,
        pendiente: Math.round((previsto - pagado) * 100) / 100,
        pagos: ps,
      };
    })
    .sort((a: ImpuestoTrimestre, b: ImpuestoTrimestre) => a.trimestre.localeCompare(b.trimestre));
}

export const finListImpuestos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ anio: z.number().int() }).parse(d))
  .handler(async ({ data, context }): Promise<ImpuestoTrimestre[]> => {
    await assertFinanzasRead(context.userId);
    return recalcImpuestos(data.anio);
  });

export const finSetImpuesto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        porcentaje_aplicable: z.number().min(0).max(100).optional(),
        estado: z.enum(["previsto", "conciliado"]).optional(),
        notas: z.string().max(1000).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertFinanzasWrite(context.userId);
    const { id, ...rest } = data;
    const { error } = await db.from("impuestos_previstos").update(rest).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const finAddPagoImpuesto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        impuesto_previsto_id: z.string().uuid(),
        fecha_pago: z.string(),
        importe_pagado: z.number(),
        referencia: z.string().max(200).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertFinanzasWrite(context.userId);
    const { error } = await db
      .from("pagos_impuestos")
      .insert({ ...data, referencia: data.referencia ?? null });
    if (error) throw new Error(error.message);

    // Conciliación automática cuando los pagos cubren la previsión.
    const { data: imp } = await db
      .from("impuestos_previstos")
      .select("importe_previsto")
      .eq("id", data.impuesto_previsto_id)
      .single();
    const { data: pagos } = await db
      .from("pagos_impuestos")
      .select("importe_pagado")
      .eq("impuesto_previsto_id", data.impuesto_previsto_id);
    const total = (pagos ?? []).reduce((s: number, p: { importe_pagado: number }) => s + num(p.importe_pagado), 0);
    if (imp && total + 0.009 >= num(imp.importe_previsto) && num(imp.importe_previsto) > 0) {
      await db.from("impuestos_previstos").update({ estado: "conciliado" }).eq("id", data.impuesto_previsto_id);
    }
    return { ok: true };
  });

export const finDeletePagoImpuesto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertFinanzasWrite(context.userId);
    const { error } = await db.from("pagos_impuestos").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------------------------------------------------------- colaboraciones
export const finListColaboraciones = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CuentaColaboracion[]> => {
    await assertFinanzasRead(context.userId);
    const { data: cuentas, error } = await db
      .from("cuentas_colaboracion")
      .select("*")
      .order("fecha_creacion", { ascending: false });
    if (error) throw new Error(error.message);
    const { data: acciones } = await db
      .from("acciones_colaboracion")
      .select("cuenta_colaboracion_id, tipo, importe");
    return (cuentas ?? []).map((c: CuentaColaboracion) => {
      const as = (acciones ?? []).filter(
        (a: AccionColaboracion) => a.cuenta_colaboracion_id === c.id,
      );
      const aportado = as
        .filter((a: AccionColaboracion) => a.tipo === "aportacion")
        .reduce((s: number, a: AccionColaboracion) => s + num(a.importe), 0);
      const gastado = as
        .filter((a: AccionColaboracion) => a.tipo === "gasto")
        .reduce((s: number, a: AccionColaboracion) => s + num(a.importe), 0);
      return { ...c, aportado, gastado, saldo: Math.round((aportado - gastado) * 100) / 100 };
    });
  });

export const finCreateCuentaColaboracion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        nombre: z.string().min(1).max(200),
        descripcion: z.string().max(1000).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertFinanzasWrite(context.userId);
    const payload = { nombre: data.nombre.trim(), descripcion: data.descripcion ?? null };
    const { error } = data.id
      ? await db.from("cuentas_colaboracion").update(payload).eq("id", data.id)
      : await db.from("cuentas_colaboracion").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const finListAcciones = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ cuenta_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<AccionColaboracion[]> => {
    await assertFinanzasRead(context.userId);
    const { data: rows, error } = await db
      .from("acciones_colaboracion")
      .select("*")
      .eq("cuenta_colaboracion_id", data.cuenta_id)
      .order("fecha", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []).map((a: AccionColaboracion) => ({ ...a, importe: num(a.importe) }));
  });

export const finCreateAccion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        cuenta_colaboracion_id: z.string().uuid(),
        fecha: z.string(),
        tipo: z.enum(["aportacion", "gasto"]),
        importe: z.number(),
        descripcion: z.string().max(1000).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertFinanzasWrite(context.userId);
    const { error } = await db
      .from("acciones_colaboracion")
      .insert({ ...data, descripcion: data.descripcion ?? null });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const finDeleteAccion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertFinanzasWrite(context.userId);
    const { error } = await db.from("acciones_colaboracion").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------------------------------------------------------- dashboard
export type FinanzasDashboard = {
  anio: number;
  saldoEstimado: number;
  ingresosTotales: number;
  gastosTotales: number;
  provisionImpuestos: number;
  trimestres: { trimestre: string; ingresos: number; gastos: number }[];
  cuotas: { pagado: number; pendiente: number; exento: number; total: number };
  impuestosTrimestreActual: ImpuestoTrimestre | null;
  facturasPendientes: Factura[];
  colaboraciones: { saldoTotal: number; gastadoTotal: number };
};

export const finDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ anio: z.number().int() }).parse(d))
  .handler(async ({ data, context }): Promise<FinanzasDashboard> => {
    await assertFinanzasRead(context.userId);
    const anio = data.anio;

    const [{ data: aportaciones }, { data: gastos }, { data: facturas }, { data: cuotas }, { data: acciones }] =
      await Promise.all([
        db.from("aportaciones").select("fecha, importe"),
        db.from("gastos").select("fecha, importe"),
        db.from("facturas").select("*"),
        db.from("cuotas_socios").select("estado").eq("anio", anio),
        db.from("acciones_colaboracion").select("tipo, importe"),
      ]);

    const impuestos = await recalcImpuestos(anio);

    const ingresoFactura = (f: { estado: string; base_imponible: number }) =>
      f.estado === "cobrada" ? num(f.base_imponible) : 0;

    const ingresosTotales =
      (aportaciones ?? []).reduce((s: number, a: { importe: number }) => s + num(a.importe), 0) +
      (facturas ?? []).reduce((s: number, f: Factura) => s + ingresoFactura(f), 0);
    const gastosTotales = (gastos ?? []).reduce((s: number, g: { importe: number }) => s + num(g.importe), 0);
    const provisionImpuestos = impuestos.reduce((s, i) => s + Math.max(0, i.pendiente), 0);

    const inYear = (iso: string) => iso?.slice(0, 4) === String(anio);
    const trimestres = (["Q1", "Q2", "Q3", "Q4"] as const).map((q) => ({
      trimestre: q,
      ingresos:
        (aportaciones ?? [])
          .filter((a: { fecha: string }) => inYear(a.fecha) && quarterOf(a.fecha) === q)
          .reduce((s: number, a: { importe: number }) => s + num(a.importe), 0) +
        (facturas ?? [])
          .filter((f: Factura) => inYear(f.fecha_emision) && quarterOf(f.fecha_emision) === q)
          .reduce((s: number, f: Factura) => s + ingresoFactura(f), 0),
      gastos: (gastos ?? [])
        .filter((g: { fecha: string }) => inYear(g.fecha) && quarterOf(g.fecha) === q)
        .reduce((s: number, g: { importe: number }) => s + num(g.importe), 0),
    }));

    const estados = (cuotas ?? []).map((c: { estado: string }) => c.estado);
    const { count: totalSocios } = await db
      .from("profiles")
      .select("id", { count: "exact", head: true });
    const pagado = estados.filter((e: string) => e === "pagado").length;
    const exento = estados.filter((e: string) => e === "exento").length;
    const total = Number(totalSocios ?? estados.length) || estados.length;

    const nowQ = quarterOf(new Date().toISOString());
    const aportadoColab = (acciones ?? [])
      .filter((a: AccionColaboracion) => a.tipo === "aportacion")
      .reduce((s: number, a: AccionColaboracion) => s + num(a.importe), 0);
    const gastadoColab = (acciones ?? [])
      .filter((a: AccionColaboracion) => a.tipo === "gasto")
      .reduce((s: number, a: AccionColaboracion) => s + num(a.importe), 0);

    const r2 = (n: number) => Math.round(n * 100) / 100;

    return {
      anio,
      ingresosTotales: r2(ingresosTotales),
      gastosTotales: r2(gastosTotales),
      provisionImpuestos: r2(provisionImpuestos),
      saldoEstimado: r2(ingresosTotales - gastosTotales - provisionImpuestos),
      trimestres: trimestres.map((t) => ({ ...t, ingresos: r2(t.ingresos), gastos: r2(t.gastos) })),
      cuotas: { pagado, exento, pendiente: Math.max(0, total - pagado - exento), total },
      impuestosTrimestreActual:
        new Date().getUTCFullYear() === anio ? (impuestos.find((i) => i.trimestre === nowQ) ?? null) : null,
      facturasPendientes: (facturas ?? [])
        .filter((f: Factura) => f.estado === "pendiente")
        .map((f: Factura) => ({ ...f, total: num(f.total), base_imponible: num(f.base_imponible) })),
      colaboraciones: { saldoTotal: r2(aportadoColab - gastadoColab), gastadoTotal: r2(gastadoColab) },
    };
  });
