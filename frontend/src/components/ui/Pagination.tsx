import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
}

function getPageNumbers(
  currentPage: number,
  totalPages: number,
): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];

  if (currentPage > 3) pages.push("ellipsis");

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (currentPage < totalPages - 2) pages.push("ellipsis");

  pages.push(totalPages);
  return pages;
}

export default function Pagination({
  currentPage,
  totalPages,
  total,
  limit,
  hasPrevPage,
  hasNextPage,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const firstItem = (currentPage - 1) * limit + 1;
  const lastItem = Math.min(currentPage * limit, total);

  return (
    <div className="mt-12 flex flex-col items-center gap-4 border-t border-border/60 pt-8">
      {/* Showing X–Y of Z products */}
      <p className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-medium text-foreground">
          {firstItem}–{lastItem}
        </span>{" "}
        of <span className="font-medium text-foreground">{total}</span> products
      </p>

      {/* Prev · page numbers · Next */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevPage}
          className="h-9 gap-1.5 px-3 text-sm disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
          Prev
        </Button>

        <div className="flex items-center gap-1">
          {getPageNumbers(currentPage, totalPages).map((page, index) =>
            page === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="grid h-9 w-9 place-items-center text-sm text-muted-foreground"
              >
                …
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page as number)}
                aria-label={`Go to page ${page}`}
                aria-current={currentPage === page ? "page" : undefined}
                className={`grid h-9 w-9 place-items-center rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  currentPage === page
                    ? "bg-foreground text-background"
                    : "text-foreground hover:bg-muted/30 border border-transparent hover:border-border"
                }`}
              >
                {page}
              </button>
            ),
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
          className="h-9 gap-1.5 px-3 text-sm disabled:opacity-40"
          aria-label="Next page"
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Page X of Y */}
      <p className="text-xs text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>
    </div>
  );
}
