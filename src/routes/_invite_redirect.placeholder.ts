import { createFileRoute } from "@tanstack/react-router";
import { Route as InviteTokenRoute } from "./invite.$token";

// Re-export so TanStack picks up /invite/$token correctly
export const Route = InviteTokenRoute as unknown as ReturnType<typeof createFileRoute>;
