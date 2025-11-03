import { TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

export interface ToastProps {
  text: string;
}

export default function Toast({ text }: ToastProps) {
  const derivedVisible = !!text;
  const [isVisible, setIsVisible] = useState<boolean>(derivedVisible);

  useEffect(() => {
    setIsVisible(derivedVisible);
  }, [derivedVisible, text]);

  if (!isVisible && !text) return null;

  const containerClass = [
    "fixed left-1/2 bottom-6 z-50 transform -translate-x-1/2 transition-opacity transition-transform duration-200",
    isVisible
      ? "opacity-100 translate-y-0 pointer-events-auto"
      : "opacity-0 translate-y-5 pointer-events-none",
  ].join(" ");

  const toastClass =
    "bg-red-800 text-white px-3 py-1 rounded-lg shadow-lg min-w-[200px] max-w-[min(90vw,420px)] flex items-center gap-3 text-sm";

  const closeButtonClass =
    "bg-transparent border-0 text-white opacity-90 cursor-pointer text-lg p-1 leading-none";

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <div className={containerClass} aria-live="assertive" role="alert">
      <div className={toastClass}>
        <TriangleAlert />
        <div className="flex-1 leading-5">{text}</div>
        <Button
          onClick={handleClose}
          aria-label="Close error"
          className={closeButtonClass}
        >
          ×
        </Button>
      </div>
    </div>
  );
}
