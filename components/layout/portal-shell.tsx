"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type PortalSidebarProps = {
  className?: string;
  children: ReactNode;
  mobileOpen?: boolean;
  onBackdropClick?: () => void;
  backdropClassName?: string;
};

export function PortalSidebar({
  className,
  children,
  mobileOpen,
  onBackdropClick,
  backdropClassName,
}: PortalSidebarProps) {
  const showBackdrop = typeof mobileOpen === "boolean" && Boolean(onBackdropClick);

  return (
    <>
      {showBackdrop ? (
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
            mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
            backdropClassName
          )}
          onClick={onBackdropClick}
        />
      ) : null}
      <aside className={className}>{children}</aside>
    </>
  );
}

type PortalHeaderProps = {
  className?: string;
  children: ReactNode;
};

export function PortalHeader({ className, children }: PortalHeaderProps) {
  return <header className={cn("sticky top-0 z-30", className)}>{children}</header>;
}

