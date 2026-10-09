"use client";

import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TableHead } from "@/components/ui/Table";
import { cn, formatPersianNumber } from "@/lib/utils";
import type { PaginationView } from "./use-pagination";
import type { SortState } from "./admin-data";

export interface SortableHeadProps<K extends string> {
  column: K;
  label: string;
  sort: SortState<K>;
  onSort: (column: K) => void;
  className?: string;
}

/** Column header that sorts on click and reports the state via `aria-sort`. */
export function SortableHead<K extends string>({
  column,
  label,
  sort,
  onSort,
  className,
}: SortableHeadProps<K>) {
  const activeSort = sort.key === column;
  const Icon = sort.dir === "asc" ? ArrowUp : ArrowDown;

  return (
    <TableHead
      className={cn("p-0", className)}
      aria-sort={activeSort ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
      scope="col"
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          "ring-focus flex h-12 w-full items-center gap-1.5 px-4 text-start text-xs font-bold leading-5 transition-colors hover:text-foreground",
          activeSort ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {label}
        <Icon aria-hidden className={cn("h-3.5 w-3.5 shrink-0", activeSort ? "opacity-100" : "opacity-0")} />
      </button>
    </TableHead>
  );
}

export interface SearchFieldProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  label: string;
  className?: string;
}

export function SearchField({ value, onValueChange, placeholder, label, className }: SearchFieldProps) {
  return (
    <Input
      type="search"
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      placeholder={placeholder}
      aria-label={label}
      className={className}
      startAdornment={<Search aria-hidden className="h-4 w-4" />}
    />
  );
}

export interface PaginationBarProps {
  view: PaginationView;
  total: number;
  /** Noun for the summary line, e.g. "عضو". */
  unit: string;
}

/**
 * Page stepper plus a count summary.
 *
 * The chevrons point the way the pages move on screen: in RTL "next" is to the
 * left, so `ChevronLeft` advances.
 */
export function PaginationBar({ view, total, unit }: PaginationBarProps) {
  if (total === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
      <p className="text-xs text-muted-foreground" aria-live="polite">
        نمایش {formatPersianNumber(view.from + 1)}–{formatPersianNumber(view.to)} از{" "}
        {formatPersianNumber(total)} {unit}
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon"
          onClick={() => view.setPage(view.page - 1)}
          disabled={view.page <= 1}
          aria-label="صفحه قبل"
        >
          <ChevronRight aria-hidden className="h-4 w-4" />
        </Button>
        <span className="min-w-24 text-center text-xs font-semibold text-foreground">
          صفحه {formatPersianNumber(view.page)} از {formatPersianNumber(view.totalPages)}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => view.setPage(view.page + 1)}
          disabled={view.page >= view.totalPages}
          aria-label="صفحه بعد"
        >
          <ChevronLeft aria-hidden className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
