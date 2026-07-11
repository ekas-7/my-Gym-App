"use client";

/**
 * SwipeToDelete — iOS HIG swipe-to-reveal-delete row.
 * Mirrors the standard trailing swipe → red delete button pattern
 * from UITableView and SwiftUI's List with .swipeActions.
 *
 * Touch behaviour:
 *  - Horizontal swipe left > 40px reveals the red delete zone
 *  - Swipe further past 72px confirms immediately (full-swipe)
 *  - Tap anywhere on row content while open → snaps back
 *  - Tap delete button → calls onDelete
 */

import { useRef, useState, useCallback } from "react";
import { IconTrash } from "@/components/icons";

interface Props {
  children: React.ReactNode;
  onDelete: () => void;
  deleteLabel?: string;
  disabled?: boolean;
}

const REVEAL_THRESHOLD = 40;  // px to start revealing
const SNAP_OPEN_AT    = 56;  // px where we snap fully open
const FULL_SWIPE_AT   = 120; // px where we treat as full-swipe confirm

export function SwipeToDelete({ children, onDelete, deleteLabel = "Delete", disabled }: Props) {
  const [open, setOpen] = useState(false);
  const startX  = useRef(0);
  const startY  = useRef(0);
  const deltaX  = useRef(0);
  const tracking = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    startX.current  = e.touches[0].clientX;
    startY.current  = e.touches[0].clientY;
    deltaX.current  = 0;
    tracking.current = true;
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!tracking.current || disabled) return;
    const dx = startX.current - e.touches[0].clientX;
    const dy = Math.abs(startY.current - e.touches[0].clientY);
    // If mostly vertical, abort horizontal tracking
    if (!open && dy > Math.abs(dx) && Math.abs(dx) < 10) {
      tracking.current = false;
      return;
    }
    if (dx < 0 && !open) return; // only left-swipe
    deltaX.current = dx;
  }, [disabled, open]);

  const handleTouchEnd = useCallback(() => {
    if (!tracking.current || disabled) return;
    tracking.current = false;

    if (deltaX.current >= FULL_SWIPE_AT) {
      // Full swipe → delete immediately
      onDelete();
      setOpen(false);
    } else if (deltaX.current >= SNAP_OPEN_AT) {
      setOpen(true);
    } else {
      setOpen(false);
    }
    deltaX.current = 0;
  }, [disabled, onDelete]);

  const close = useCallback(() => setOpen(false), []);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    onDelete();
  }, [onDelete]);

  return (
    <div
      className={`swipe-row${open ? " swipe-row--open" : ""}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main content — slides left when open */}
      <div className="swipe-row__content" onClick={open ? close : undefined}>
        {children}
      </div>

      {/* Red delete zone revealed on swipe */}
      <button
        className="swipe-row__delete"
        onClick={handleDelete}
        aria-label={deleteLabel}
        tabIndex={open ? 0 : -1}
      >
        <IconTrash size={18} className="text-white" />
      </button>
    </div>
  );
}
