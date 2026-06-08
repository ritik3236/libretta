"use client";

import * as React from "react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";

// Bottom sheet built on Vaul — native-feeling drag-to-dismiss (velocity +
// inertia), scroll handling, and accessibility, with our styling on top.
const Sheet = Drawer.Root;
const SheetTrigger = Drawer.Trigger;
const SheetClose = Drawer.Close;

function SheetContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Drawer.Content>) {
  return (
    <Drawer.Portal>
      <Drawer.Overlay className="fixed inset-0 z-50 bg-black/50" />
      <Drawer.Content
        aria-describedby={undefined}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88vh] w-full max-w-[480px] flex-col rounded-t-3xl border-t bg-card outline-none",
          className,
        )}
        {...props}
      >
        {/* grab handle */}
        <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-muted" />
        <div className="overflow-y-auto overscroll-contain p-5 pt-4 pb-[max(20px,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </Drawer.Content>
    </Drawer.Portal>
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof Drawer.Title>) {
  return (
    <Drawer.Title
      className={cn("text-base font-bold tracking-tight", className)}
      {...props}
    />
  );
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetTitle };
