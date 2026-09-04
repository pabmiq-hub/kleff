// Registry of the ported Konektum backend functions (server-only).
type Handler = (req: Request) => Promise<Response>;

const LOADERS: Record<string, () => Promise<{ default: Handler }>> = {
  "check-wrapped-eligibility": () => import("./check-wrapped-eligibility.server"),
  "checkin-participant": () => import("./checkin-participant.server"),
  "confirm-preliminary": () => import("./confirm-preliminary.server"),
  "create-organizer": () => import("./create-organizer.server"),
  "delete-auth-user": () => import("./delete-auth-user.server"),
  "generate-and-send-code": () => import("./generate-and-send-code.server"),
  "get-event-participants": () => import("./get-event-participants.server"),
  "get-game-round": () => import("./get-game-round.server"),
  "get-table-assignments": () => import("./get-table-assignments.server"),
  "get-wrapped-compatibility": () => import("./get-wrapped-compatibility.server"),
  "handle-participant-cancellation": () => import("./handle-participant-cancellation.server"),
  "icebreaker-emoji": () => import("./icebreaker-emoji.server"),
  "icebreaker-select": () => import("./icebreaker-select.server"),
  "icebreaker-timeline": () => import("./icebreaker-timeline.server"),
  "icebreakers": () => import("./icebreakers.server"),
  "list-auth-users": () => import("./list-auth-users.server"),
  "manage-domain": () => import("./manage-domain.server"),
  "notify-organizer": () => import("./notify-organizer.server"),
  "register-participant": () => import("./register-participant.server"),
  "request-crush": () => import("./request-crush.server"),
  "request-repeat": () => import("./request-repeat.server"),
  "request-wrapped-table": () => import("./request-wrapped-table.server"),
  "respond-crush": () => import("./respond-crush.server"),
  "respond-repeat": () => import("./respond-repeat.server"),
  "respond-wrapped-table": () => import("./respond-wrapped-table.server"),
  "send-automatic-codes": () => import("./send-automatic-codes.server"),
  "send-checkin-code": () => import("./send-checkin-code.server"),
  "send-match-emails": () => import("./send-match-emails.server"),
  "send-payment-reminder": () => import("./send-payment-reminder.server"),
  "send-registration-confirmation": () => import("./send-registration-confirmation.server"),
  "send-remarketing-email": () => import("./send-remarketing-email.server"),
  "send-reminder-email": () => import("./send-reminder-email.server"),
  "send-scheduled-emails": () => import("./send-scheduled-emails.server"),
  "send-super-like-notification": () => import("./send-super-like-notification.server"),
  "send-verification-email": () => import("./send-verification-email.server"),
  "send-waitlist-confirmation": () => import("./send-waitlist-confirmation.server"),
  "setup-super-admin": () => import("./setup-super-admin.server"),
  "submit-game-vote": () => import("./submit-game-vote.server"),
  "submit-selections": () => import("./submit-selections.server"),
  "update-selection": () => import("./update-selection.server"),
};

export function isKonFunction(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(LOADERS, name);
}

export async function runKonFunction(name: string, req: Request): Promise<Response> {
  const loader = LOADERS[name];
  if (!loader) return new Response(JSON.stringify({ error: "Unknown function" }), { status: 404, headers: { "Content-Type": "application/json" } });
  const mod = await loader();
  return await mod.default(req);
}
