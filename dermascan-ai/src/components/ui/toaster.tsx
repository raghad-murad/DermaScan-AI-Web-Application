import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

function ToastAutoDismiss({ id, dismiss }: { id: string; dismiss: (id?: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => dismiss(id), 5000);
    return () => clearTimeout(timer);
  }, [id, dismiss]);
  return null;
}

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, open: _open, onOpenChange: _onOpenChange, ...props }) {
        return (
          <Toast key={id} {...props}>
            <ToastAutoDismiss id={id} dismiss={dismiss} />
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose onClick={() => dismiss(id)} />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
