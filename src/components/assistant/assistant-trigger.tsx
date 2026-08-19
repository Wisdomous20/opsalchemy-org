"use client";

import type { ReactNode } from "react";

interface AssistantTriggerProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function AssistantTrigger({ children, className }: AssistantTriggerProps) {
  function openAssistant() {
    if (window.location.hash === "#assistant") {
      window.dispatchEvent(new Event("opsalchemy:open-assistant"));
      return;
    }

    window.location.hash = "assistant";
  }

  return (
    <button type="button" className={className} onClick={openAssistant}>
      {children}
    </button>
  );
}
