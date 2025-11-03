import { useEffect, useState } from "react";

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
    "bg-red-800 text-white px-4 py-3 rounded-lg shadow-lg min-w-[200px] max-w-[min(90vw,420px)] flex items-center gap-3 text-sm";

  const closeButtonClass =
    "bg-transparent border-0 text-white opacity-90 cursor-pointer text-lg p-1 leading-none";

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <div
      className={containerClass}
      aria-live="assertive"
      role="alert"
      aria-atomic="true"
    >
      <div className={toastClass}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 9v4"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 17h.01"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
            stroke="transparent"
            fill="rgba(255,255,255,0.08)"
          />
        </svg>

        <div className="flex-1 leading-5">{text}</div>

        <button
          onClick={handleClose}
          aria-label="Close error"
          className={closeButtonClass}
        >
          ×
        </button>
      </div>
    </div>
  );
}
