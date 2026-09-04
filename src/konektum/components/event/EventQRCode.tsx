// @ts-nocheck
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/konektum/ui/card";
import { Button } from "@/konektum/ui/button";
import { Download, X } from "lucide-react";
import { useRef } from "react";
import { eventPublicUrl } from "@/konektum/lib/publicUrls";

interface EventQRCodeProps {
  eventId: string;
  eventSlug?: string | null;
  onClose: () => void;
  type?: "join" | "select" | "checkin" | "tables" | "access"; // join = registration, select = match selection, checkin = attendance, tables = view seating, access = unified panel
}

const EventQRCode = ({ eventId, eventSlug, onClose, type = "select" }: EventQRCodeProps) => {
  const qrRef = useRef<HTMLDivElement>(null);

  // Public URL: friendly slug when available, event id otherwise
  const participantUrl = eventPublicUrl(eventSlug || eventId, type);

  
  const getTitle = () => {
    switch (type) {
      case "join":
        return "QR de Registro";
      case "checkin":
        return "QR de Check-in";
      case "tables":
        return "QR de Mesas";
      case "access":
        return "QR Panel del Participante";
      default:
        return "QR de Selección";
    }
  };
  
  const getDescription = () => {
    switch (type) {
      case "join":
        return "Los participantes pueden escanear para unirse al evento";
      case "checkin":
        return "Los participantes pueden escanear para confirmar su asistencia";
      case "tables":
        return "Los participantes pueden escanear para ver sus mesas asignadas (requiere código)";
      case "access":
        return "Los participantes pueden ver sus mesas y enviar selecciones con su código";
      default:
        return "Los participantes pueden escanear para seleccionar sus matches (requiere código)";
    }
  };

  const handleDownload = () => {
    if (!qrRef.current) return;
    
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `qr-evento-${eventId}-${type}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md animate-scale-in">
        <CardHeader className="text-center relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
          <CardTitle>{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div 
            ref={qrRef}
            className="p-4 bg-white rounded-xl shadow-inner"
          >
            <QRCodeSVG
              value={participantUrl}
              size={240}
              level="H"
              includeMargin
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
          
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">
              URL del evento:
            </p>
            <p className="text-xs font-mono bg-muted px-3 py-2 rounded-lg break-all">
              {participantUrl}
            </p>
          </div>
          
          <div className="flex gap-3 w-full">
            <Button variant="outline" className="flex-1" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Descargar QR
            </Button>
            <Button variant="default" className="flex-1" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventQRCode;
