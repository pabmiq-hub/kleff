import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function guard(userId: string) {
  const { assertSuperAdmin } = await import("@/lib/assert-role.server");
  await assertSuperAdmin(userId);
}

export const getKonektumOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await guard(context.userId);
    const { loadKonektumOverview } = await import("@/lib/konektum.server");
    return loadKonektumOverview();
  });

export const getKonektumEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ eventId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await guard(context.userId);
    const { loadKonektumEvent } = await import("@/lib/konektum.server");
    return loadKonektumEvent(data.eventId);
  });

export const saveKonektumEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ eventId: z.string().uuid(), patch: z.record(z.string(), z.unknown()) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await guard(context.userId);
    const { updateKonektumEvent } = await import("@/lib/konektum.server");
    return updateKonektumEvent(data.eventId, data.patch);
  });

export const saveKonektumParticipant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ participantId: z.string().uuid(), patch: z.record(z.string(), z.unknown()) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await guard(context.userId);
    const { updateKonektumParticipant } = await import("@/lib/konektum.server");
    return updateKonektumParticipant(data.participantId, data.patch);
  });

export const addKonektumParticipant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ eventId: z.string().uuid(), values: z.record(z.string(), z.unknown()) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await guard(context.userId);
    const { createKonektumParticipant } = await import("@/lib/konektum.server");
    return createKonektumParticipant(data.eventId, data.values);
  });

export const removeKonektumParticipant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ participantId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await guard(context.userId);
    const { deleteKonektumParticipant } = await import("@/lib/konektum.server");
    return deleteKonektumParticipant(data.participantId);
  });

export const addKonektumPairFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        kind: z.enum(["exclusion", "inclusion"]),
        eventId: z.string().uuid(),
        p1: z.string().uuid(),
        p2: z.string().uuid(),
        reason: z.string().nullable().default(null),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await guard(context.userId);
    const { addKonektumPair } = await import("@/lib/konektum.server");
    return addKonektumPair(data.kind, data.eventId, data.p1, data.p2, data.reason);
  });

export const removeKonektumPairFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ kind: z.enum(["exclusion", "inclusion"]), id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await guard(context.userId);
    const { deleteKonektumPair } = await import("@/lib/konektum.server");
    return deleteKonektumPair(data.kind, data.id);
  });

export const promoteKonektumWaitlistFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ entryId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await guard(context.userId);
    const { promoteKonektumWaitlist } = await import("@/lib/konektum.server");
    return promoteKonektumWaitlist(data.entryId);
  });

export const generateKonektumTablesFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ eventId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await guard(context.userId);
    const { generateKonektumTables } = await import("@/lib/konektum.server");
    return generateKonektumTables(data.eventId);
  });
