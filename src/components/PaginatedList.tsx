import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps<T> {
  items: T[];
  itemsPerPage?: number;
  renderItem: (item: T) => React.ReactNode;
  listClassName?: string;
  sortByDateDesc?: (item: T) => string | undefined; 
}

export function PaginatedList<T>({
  items,
  itemsPerPage = 10,
  renderItem,
  listClassName = "space-y-3",
  sortByDateDesc
}: PaginationProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  const sortedItems = React.useMemo(() => {
    if (!sortByDateDesc) return items;
    return [...items].sort((a, b) => {
      const dateA = sortByDateDesc(a);
      const dateB = sortByDateDesc(b);
      if (!dateA) return 1;
      if (!dateB) return -1;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [items, sortByDateDesc]);

  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = sortedItems.slice(startIndex, startIndex + itemsPerPage);

  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className={listClassName}>
        {paginatedItems.map(renderItem)}
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-4">
          <span className="text-xs text-slate-500">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedItems.length)} of {sortedItems.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 transition cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-medium text-slate-700 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 transition cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
