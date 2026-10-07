"use client";
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { useChildren } from "@/hooks/useChildren";
import { useChildStore } from "@/store/childStore";

const classLine = (child) =>
  [child?.class?.name, child?.section?.name].filter(Boolean).join(" · ");

function Avatar({ child, size = "w-8 h-8" }) {
  if (child?.photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={child.photo}
        alt={child.name || "Child"}
        className={`${size} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${size} rounded-full bg-[#00918e] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0`}
    >
      {(child?.name || "C").charAt(0).toUpperCase()}
    </div>
  );
}

function ChildLabel({ child }) {
  return (
    <div className="min-w-0 text-left">
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
        {child?.name || "—"}
      </p>
      {classLine(child) && (
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {classLine(child)}
        </p>
      )}
    </div>
  );
}

// Shows the child the dashboard is about. With several children it becomes a
// dropdown; picking one changes the store's selectedChildId, and every query
// key contains that id, so the pages refetch for the new child.
export const ChildSwitcher = () => {
  const { data } = useChildren();
  const childList = data ?? [];
  const selectedChildId = useChildStore((s) => s.selectedChildId);
  const setSelectedChildId = useChildStore((s) => s.setSelectedChildId);
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const selected = childList.find((c) => c._id === selectedChildId) || null;
  const canSwitch = childList.length > 1;

  useEffect(() => {
    if (!isOpen) return;
    const update = () => {
      if (buttonRef.current) {
        const r = buttonRef.current.getBoundingClientRect();
        setAnchorRect({ top: r.bottom, right: window.innerWidth - r.right });
      }
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (
        buttonRef.current?.contains(event.target) ||
        menuRef.current?.contains(event.target)
      ) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (!selected) return null;

  const choose = (id) => {
    setIsOpen(false);
    if (id === selectedChildId) return;
    setSelectedChildId(id);
    // A homework detail belongs to one child; go back to the list.
    if (pathname.startsWith("/dashboard/homework/")) {
      router.push("/dashboard/homework");
    }
  };

  if (!canSwitch) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 max-w-[12rem] sm:max-w-[16rem]">
        <Avatar child={selected} />
        <div className="hidden sm:block min-w-0">
          <ChildLabel child={selected} />
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Switch child"
        aria-expanded={isOpen}
        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors max-w-[12rem] sm:max-w-[16rem]"
      >
        <Avatar child={selected} />
        <div className="hidden sm:block min-w-0">
          <ChildLabel child={selected} />
        </div>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 text-gray-600 dark:text-gray-300 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen &&
        anchorRect &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{
              position: "fixed",
              top: anchorRect.top + 8,
              right: Math.max(anchorRect.right, 8),
              width: "16rem",
              maxHeight: "60vh",
            }}
            className="overflow-y-auto bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-[60]"
          >
            <p className="px-4 pb-2 text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 border-b border-gray-200 dark:border-gray-700">
              Your children
            </p>
            {childList.map((c) => {
              const active = c._id === selectedChildId;
              return (
                <button
                  key={c._id}
                  role="option"
                  aria-selected={active}
                  onClick={() => choose(c._id)}
                  className={`w-full flex items-center gap-3 px-4 py-2 transition-colors text-left hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    active ? "bg-[#00918e]/5" : ""
                  }`}
                >
                  <Avatar child={c} />
                  <div className="flex-1 min-w-0">
                    <ChildLabel child={c} />
                  </div>
                  {active && (
                    <Check className="w-4 h-4 text-[#00918e] flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
};
