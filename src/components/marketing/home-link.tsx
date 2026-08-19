"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export function HomeLink({ children }: { readonly children: ReactNode }) {
  return (
    <Link
      href="/#top"
      aria-label="OPSAlchemy home, return to top"
      onClick={(event) => {
        if (window.location.pathname !== "/") return;
        event.preventDefault();
        window.location.hash = "top";
        document.getElementById("top")?.scrollIntoView({ behavior: "smooth" });
      }}
    >
      {children}
    </Link>
  );
}
