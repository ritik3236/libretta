"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;

function SheetContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const startY = React.useRef<number | null>(null);
  const [dragY, setDragY] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);

  function onTouchStart(e: React.TouchEvent) {
    // Only start a dismiss-drag when the sheet is scrolled to the very top.
    if ((contentRef.current?.scrollTop ?? 0) <= 0) {
      startY.current = e.touches[0].clientY;
      setDragging(true);
    }
  }
  function onTouchMove(e: React.TouchEvent) {
    if (startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    setDragY(dy > 0 ? dy : 0); // only track downward pulls
  }
  function onTouchEnd() {
    if (startY.current !== null && dragY > 110) closeRef.current?.click();
    startY.current = null;
    setDragging(false);
    setDragY(0);
  }

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogPrimitive.Content
        ref={contentRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: dragging ? "none" : "transform 0.2s ease",
        }}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88vh] w-full max-w-[480px] flex-col overflow-y-auto overscroll-contain rounded-t-3xl border-t bg-card p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-2xl",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom data-[state=open]:duration-300",
          className,
        )}
        {...props}
      >
        {/* hidden close target for the swipe-to-dismiss gesture */}
        <DialogPrimitive.Close ref={closeRef} className="sr-only" aria-hidden tabIndex={-1} />
        {/* grab handle */}
        <div className="mx-auto mb-4 h-1.5 w-10 shrink-0 rounded-full bg-muted" />
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("text-base font-bold tracking-tight", className)}
      {...props}
    />
  );
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetTitle };
