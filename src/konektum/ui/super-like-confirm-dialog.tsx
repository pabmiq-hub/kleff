// @ts-nocheck
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/konektum/ui/dialog";
import { Button } from "@/konektum/ui/button";
import { Star } from "lucide-react";

interface SuperLikeConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  recipientName: string;
  language?: "es" | "en";
  /** Super Likes still available (base + extras won in the game). */
  remaining?: number;
}

const SuperLikeConfirmDialog = ({ open, onClose, onConfirm, recipientName, language = "es", remaining }: SuperLikeConfirmDialogProps) => {
  const isEn = language === "en";
  const left = typeof remaining === "number" ? Math.max(0, remaining) : 1;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center mx-auto mb-2 shadow-lg">
            <Star className="w-8 h-8 text-white fill-white" />
          </div>
          <DialogTitle className="text-center text-xl">
            {isEn ? "Send Super Like?" : "¿Enviar Super Like?"}
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            {isEn ? (
              <>
                You're about to give a Super Like to <strong>{recipientName}</strong>. You have{" "}
                <strong className="text-amber-600">{left}</strong> available. They will receive an anonymous notification immediately.
              </>
            ) : (
              <>
                Vas a dar un Super Like a <strong>{recipientName}</strong>. Te quedan{" "}
                <strong className="text-amber-600">{left}</strong> disponibles. Recibirá una notificación anónima inmediatamente.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            {isEn ? "Cancel" : "Cancelar"}
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white shadow-md"
          >
            <Star className="w-4 h-4 mr-2 fill-white" />
            {isEn ? "Send Super Like" : "Enviar Super Like"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SuperLikeConfirmDialog;
