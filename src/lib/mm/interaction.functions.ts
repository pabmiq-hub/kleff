import { createServerFn } from "@tanstack/react-start";
import { interactionInput } from "./interactions";

export const mmInteract = createServerFn({ method: "POST" })
  .inputValidator(input => interactionInput.parse(input))
  .handler(async ({ data }) => {
    const e = await import("./engine.server");
    const { sp, s } = await e.verifyPlayerToken(data.token, data.sessionId);
    const { interact } = await import("./interaction.server");
    await interact(sp, s, data);
    await e.broadcast(e.sessionTopic(s), "interactions", {});
    return { ok: true };
  });