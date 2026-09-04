// @ts-nocheck
import { AlertCircle } from "lucide-react";

interface FieldErrorProps {
  show?: boolean;
  message?: string;
}

/** Inline error message shown under an invalid form field. */
export const FieldError = ({ show, message }: FieldErrorProps) => {
  if (!show) return null;
  return (
    <p className="flex items-center gap-1.5 text-xs font-medium text-destructive animate-fade-in">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      {message}
    </p>
  );
};

export default FieldError;
