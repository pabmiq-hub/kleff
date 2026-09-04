// @ts-nocheck
/**
 * Carga y comparte los datos del panel de Konektum entre las rutas
 * (misma lógica que el AdminDashboard original, pero con el menú arriba).
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/konektum/supabase";
import { useAuth } from "@/konektum/hooks/useAuth";
import { useOrganizer } from "@/konektum/hooks/useOrganizer";
import { useFeatures } from "@/konektum/hooks/useFeatures";
import { useToast } from "@/konektum/hooks/use-toast";
import type { AnalyticsData, ParticipantRecord } from "@/konektum/pages/AdminDashboard";

interface AdminDataValue {
  user: any;
  organizer: any;
  plan: any;
  limits: any;
  branding: any;
  refreshOrganizer: () => void;
  events: any[];
  realEvents: any[];
  stats: AnalyticsData["stats"];
  participants: ParticipantRecord[];
  analyticsData: AnalyticsData;
  isPro: boolean;
  hasFeature: (code: string) => boolean;
  isSuperAdmin: boolean;
  deleteEvent: (id: string) => Promise<void>;
  reload: () => void;
}

const Ctx = createContext<AdminDataValue | null>(null);

export function useAdminData() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAdminData debe usarse dentro de AdminDataProvider");
  return v;
}

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    uniqueParticipants: 0,
    totalConnections: 0,
    returningParticipants: 0,
    selectionRate: 0,
  });
  const [participants, setParticipants] = useState<ParticipantRecord[]>([]);
  const [encounters, setEncounters] = useState<any[]>([]);
  const [selections, setSelections] = useState<any[]>([]);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const {
    organizer,
    plan,
    limits,
    loading: orgLoading,
    isActive,
    branding,
    refresh: refreshOrganizer,
  } = useOrganizer();
  const { isSuperAdmin, hasFeature } = useFeatures();

  const loadEvents = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("organizer_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) setEvents(data);
    setIsLoading(false);
  };

  const loadStats = async () => {
    if (!user) return;
    const { count: uniqueCount } = await supabase
      .from("global_participants")
      .select("*", { count: "exact", head: true })
      .eq("organizer_id", user.id);
    const { count: returningCount } = await supabase
      .from("global_participants")
      .select("*", { count: "exact", head: true })
      .eq("organizer_id", user.id)
      .gt("events_attended", 1);

    const { data: orgEvents } = await supabase
      .from("events")
      .select("id")
      .eq("organizer_id", user.id)
      .eq("is_test_event", false);
    const eventIds = orgEvents?.map((e) => e.id) || [];

    let totalParticipants = 0;
    let submittedCount = 0;
    if (eventIds.length > 0) {
      const { count: tp } = await supabase
        .from("participants")
        .select("*", { count: "exact", head: true })
        .in("event_id", eventIds)
        .eq("is_fake", false);
      const { count: sc } = await supabase
        .from("participants")
        .select("*", { count: "exact", head: true })
        .in("event_id", eventIds)
        .eq("is_fake", false)
        .not("selection_submitted_at", "is", null);
      totalParticipants = tp || 0;
      submittedCount = sc || 0;
    }

    let mutualMatches = 0;
    if (eventIds.length > 0) {
      const { data: allSelections } = await supabase
        .from("participant_selections")
        .select("selector_id, selected_id, event_id")
        .in("event_id", eventIds);
      if (allSelections) {
        const selSet = new Set(allSelections.map((s) => `${s.selector_id}->${s.selected_id}`));
        const counted = new Set<string>();
        allSelections.forEach((s) => {
          const reverse = `${s.selected_id}->${s.selector_id}`;
          const pairKey = [s.selector_id, s.selected_id].sort().join(":");
          if (selSet.has(reverse) && !counted.has(pairKey)) {
            counted.add(pairKey);
            mutualMatches++;
          }
        });
      }
    }

    setStats({
      uniqueParticipants: uniqueCount || 0,
      totalConnections: mutualMatches,
      returningParticipants: returningCount || 0,
      selectionRate: totalParticipants ? Math.round((submittedCount / totalParticipants) * 100) : 0,
    });
  };

  const loadAnalyticsData = async () => {
    if (!user) return;
    const { data: orgEvents } = await supabase
      .from("events")
      .select("id")
      .eq("organizer_id", user.id)
      .eq("is_test_event", false);
    const eventIds = orgEvents?.map((e) => e.id) || [];
    if (eventIds.length === 0) return;

    const { data: pData } = await supabase
      .from("participants")
      .select(
        "id, event_id, name, checked_in, selection_submitted_at, gender, age_range, birth_date, global_participant_id, preference, dating_preference, entity_type, sector, needs, solutions, is_fake",
      )
      .in("event_id", eventIds)
      .eq("is_fake", false);
    if (pData) setParticipants(pData as ParticipantRecord[]);

    const { data: eData } = await supabase
      .from("participant_encounters")
      .select("event_id")
      .eq("organizer_id", user.id)
      .in("event_id", eventIds);
    if (eData) setEncounters(eData);

    const { data: sData } = await supabase
      .from("participant_selections")
      .select("event_id, selector_id, selected_id, selection_type")
      .in("event_id", eventIds);
    if (sData) setSelections(sData);
  };

  const reload = () => {
    void loadEvents();
    void loadStats();
    void loadAnalyticsData();
  };

  useEffect(() => {
    if (user && (isActive || isSuperAdmin)) reload();
    else if (!authLoading && !user) setIsLoading(false);
  }, [user, isActive, isSuperAdmin, authLoading]);

  const deleteEvent = async (eventId: string) => {
    const { error } = await supabase.from("events").delete().eq("id", eventId);
    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar el evento", variant: "destructive" });
      return;
    }
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    toast({ title: "Evento eliminado", description: "El evento ha sido eliminado correctamente" });
  };

  if (authLoading || orgLoading || isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isPro = Boolean(branding?.isProfessionalOnly);
  const value: AdminDataValue = {
    user,
    organizer,
    plan,
    limits,
    branding,
    refreshOrganizer,
    events,
    realEvents: events.filter((e) => !e.is_test_event),
    stats,
    participants,
    analyticsData: { events, stats, participants, encounters, selections, isPro },
    isPro,
    hasFeature,
    isSuperAdmin,
    deleteEvent,
    reload,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
