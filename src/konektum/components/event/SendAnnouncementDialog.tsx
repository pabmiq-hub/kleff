import { useMemo, useState } from "react";
import { Loader2, Megaphone, Send } from "lucide-react";
import { supabase } from "@/konektum/supabase";
import { Button } from "@/konektum/ui/button";
import { Input } from "@/konektum/ui/input";
import { Label } from "@/konektum/ui/label";
import { Checkbox } from "@/konektum/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/konektum/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/konektum/ui/dialog";
import { RichTextEditor } from "@/konektum/ui/rich-text-editor";
import { hasAnnouncementText, renderAnnouncementEmail } from "@/konektum/lib/announcement";
import { useToast } from "@/konektum/hooks/use-toast";

interface Recipient { id: string; name: string; email?: string | null }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventName: string;
  isEn?: boolean;
  recipients: Recipient[];
  branding?: { brandName?: string; primaryColor?: string; logoUrl?: string; logoHeight?: number };
}

export default function SendAnnouncementDialog({ open, onOpenChange, eventId, eventName, isEn, recipients, branding }: Props) {
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [includeCancel, setIncludeCancel] = useState(true);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const withEmail = recipients.filter((r) => r.email);
  const canSend = subject.trim().length > 0 && hasAnnouncementText(bodyHtml) && withEmail.length > 0 && !sending;

  const preview = useMemo(
    () =>
      renderAnnouncementEmail({
        subject: subject.trim() || (isEn ? "Email title" : "Título del correo"),
        bodyHtml: bodyHtml || "<p>…</p>",
        participantName: withEmail[0]?.name || (isEn ? "Alex" : "Laura"),
        cancelUrl: includeCancel ? "#" : null,
        isEn,
        brandName: branding?.brandName,
        primaryColor: branding?.primaryColor,
        logoUrl: branding?.logoUrl || "https://kleff.es/kleff-logo.png",
        logoHeight: branding?.logoHeight,
      }).html,
    [subject, bodyHtml, includeCancel, isEn, branding, withEmail],
  );

  const send = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("No estás autenticado");
      const { data, error } = await supabase.functions.invoke("send-announcement-email", {
        body: {
          event_id: eventId,
          participant_ids: withEmail.map((r) => r.id),
          subject: subject.trim(),
          body_html: bodyHtml,
          include_cancel: includeCancel,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.skipped) {
        toast({ title: "Evento de prueba", description: "No se ha enviado ningún correo" });
      } else {
        const sent = data?.stats?.sent ?? 0;
        const failed = data?.stats?.failed ?? 0;
        if (failed > 0) toast({ title: "Comunicado enviado con fallos", description: `Enviado a ${sent} · ${failed} fallaron`, variant: "destructive" });
        else toast({ title: "Comunicado enviado", description: `Enviado a ${sent} ${sent === 1 ? "persona" : "personas"}` });
      }
      setSubject("");
      setBodyHtml("");
      setIncludeCancel(true);
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "No se pudo enviar el comunicado", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !sending && onOpenChange(v)}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5" /> Enviar comunicado
          </DialogTitle>
          <DialogDescription>
            {withEmail.length > 0
              ? `Se enviará a ${withEmail.length} ${withEmail.length === 1 ? "inscrito activo" : "inscritos activos"} con correo de «${eventName}». Las bajas no lo reciben.`
              : "No hay inscritos activos con correo en este evento."}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="edit">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Redactar</TabsTrigger>
            <TabsTrigger value="preview">Vista previa</TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="announcement-subject">Título del correo</Label>
              <Input
                id="announcement-subject"
                value={subject}
                maxLength={200}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ej.: Cambio de ubicación para el viernes"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mensaje</Label>
              <p className="text-xs text-muted-foreground">
                El saludo «¡Hola, nombre!» se añade solo. Puedes usar negrita, cursiva, listas y enlaces.
              </p>
              <RichTextEditor value={bodyHtml} onChange={setBodyHtml} placeholder="Escribe aquí el comunicado…" minHeight="180px" />
            </div>
            <label className="flex items-start gap-3 rounded-md border p-3 cursor-pointer">
              <Checkbox checked={includeCancel} onCheckedChange={(v) => setIncludeCancel(v === true)} className="mt-0.5" />
              <span className="text-sm">
                <span className="font-medium block">Incluir opción de darse de baja</span>
                <span className="text-muted-foreground">
                  Añade el aviso de compromiso de asistencia y un enlace personal para liberar su plaza (o escribir a hola@kleff.es).
                </span>
              </span>
            </label>
          </TabsContent>

          <TabsContent value="preview" className="pt-2">
            <iframe
              title="Vista previa del comunicado"
              srcDoc={preview}
              sandbox=""
              className="w-full h-[480px] rounded-md border bg-muted"
            />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>Cancelar</Button>
          <Button onClick={send} disabled={!canSend}>
            {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            {sending ? "Enviando…" : `Enviar${withEmail.length ? ` (${withEmail.length})` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
