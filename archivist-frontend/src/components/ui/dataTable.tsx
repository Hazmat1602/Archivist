import * as React from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type FilterVariant = "text" | "select" | "none";

type FilterOption = { label: string; value: string };

type RowContext<TData> = { row: { original: TData } };

type HeaderContext<TData> = { column: ExcelColumnDef<TData>; direction: false | "asc" | "desc" };

export type ExcelColumnDef<TData> = {
  accessorKey: Extract<keyof TData, string>;
  header: React.ReactNode;
  cell?: (context: RowContext<TData>) => React.ReactNode;
  enableSorting?: boolean;
  enableColumnFilter?: boolean;
  filterFn?: string;
  sortingFn?: (a: TData, b: TData, id: Extract<keyof TData, string>) => number;
  meta?: {
    className?: string;
    headerClassName?: string;
    filterVariant?: FilterVariant;
    filterPlaceholder?: string;
    filterOptions?: FilterOption[];
    getOptionLabel?: (row: TData) => string;
    getFilterValue?: (row: TData) => string;
  };
  headerRenderer?: (context: HeaderContext<TData>) => React.ReactNode;
};

type ExcelStyleDataTableProps<TData> = {
  columns: ExcelColumnDef<TData>[];
  data: TData[];
  pageSize?: number;
  emptyMessage?: string;
};

function getRawValue<TData>(row: TData, column: ExcelColumnDef<TData>): unknown {
  return row[column.accessorKey];
}

function getStringValue<TData>(row: TData, column: ExcelColumnDef<TData>): string {
  const raw = column.meta?.getFilterValue ? column.meta.getFilterValue(row) : getRawValue(row, column);
  return raw == null ? "" : String(raw);
}

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") return <ChevronUp className="h-4 w-4" />;
  if (direction === "desc") return <ChevronDown className="h-4 w-4" />;
  return null;
}

export function ExcelStyleDataTable<TData>({
  columns,
  data,
  pageSize = 10,
  emptyMessage = "No results.",
}: ExcelStyleDataTableProps<TData>) {
  const [sort, setSort] = React.useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [filters, setFilters] = React.useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(pageSize);
  const [pageInput, setPageInput] = React.useState("1");

  const filterOptions = React.useMemo(() => {
    const optionsByColumn: Record<string, FilterOption[]> = {};

    for (const column of columns) {
      if (!column.enableColumnFilter || column.meta?.filterVariant === "none") continue;

      if (column.meta?.filterOptions?.length) {
        optionsByColumn[column.accessorKey] = column.meta.filterOptions;
        continue;
      }

      const values = new Map<string, string>();
      for (const row of data) {
        const value = getStringValue(row, column);
        const label = column.meta?.getOptionLabel ? column.meta.getOptionLabel(row) : value || "(Blank)";

        if (!values.has(value)) {
          values.set(value, label);
        }
      }

      optionsByColumn[column.accessorKey] = Array.from(values.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }

    return optionsByColumn;
  }, [columns, data]);

  const filteredData = React.useMemo(() => {
    return data.filter((row) =>
      columns.every((column) => {
        if (!column.enableColumnFilter || column.meta?.filterVariant === "none") return true;
        const selected = filters[column.accessorKey];
        if (!selected) return true;
        return getStringValue(row, column) === selected;
      })
    );
  }, [columns, data, filters]);

  const sortedData = React.useMemo(() => {
    if (!sort) return filteredData;

    const column = columns.find((c) => c.accessorKey === sort.key);
    if (!column) return filteredData;

    const directionFactor = sort.direction === "asc" ? 1 : -1;

    return [...filteredData].sort((a, b) => {
      if (column.sortingFn) {
        return column.sortingFn(a, b, column.accessorKey) * directionFactor;
      }

      const aValue = getRawValue(a, column);
      const bValue = getRawValue(b, column);
      const aText = aValue == null ? "" : String(aValue);
      const bText = bValue == null ? "" : String(bValue);
      return aText.localeCompare(bText) * directionFactor;
    });
  }, [columns, filteredData, sort]);

  const pageCount = Math.max(1, Math.ceil(sortedData.length / rowsPerPage));
  const safePage = Math.min(currentPage, pageCount - 1);
  const pagedRows = React.useMemo(() => {
    const start = safePage * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [safePage, rowsPerPage, sortedData]);

  React.useEffect(() => {
    setCurrentPage(0);
  }, [filters, rowsPerPage, sort]);

  React.useEffect(() => {
    setPageInput(String(safePage + 1));
  }, [safePage]);

  const toggleSort = (column: ExcelColumnDef<TData>) => {
    if (!column.enableSorting) return;

    setSort((prev) => {
      if (!prev || prev.key !== column.accessorKey) return { key: column.accessorKey, direction: "asc" };
      if (prev.direction === "asc") return { key: column.accessorKey, direction: "desc" };
      return null;
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {columns
          .filter((column) => column.enableColumnFilter && column.meta?.filterVariant !== "none")
          .map((column) => (
            <div key={column.accessorKey} className="space-y-1">
              <div className="text-xs font-medium text-slate-500">{column.header}</div>
              <Select
                value={filters[column.accessorKey] ?? "__ALL__"}
                onValueChange={(value) => {
                  setFilters((prev) => ({
                    ...prev,
                    [column.accessorKey]: value === "__ALL__" ? "" : value,
                  }));
                }}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder={column.meta?.filterPlaceholder || "All"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__ALL__">All</SelectItem>
                  {(filterOptions[column.accessorKey] ?? []).map((option) => (
                    <SelectItem key={`${column.accessorKey}-${option.value}`} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => {
                const direction = sort?.key === column.accessorKey ? sort.direction : false;

                return (
                  <TableHead key={column.accessorKey} className={column.meta?.headerClassName}>
                    <button
                      type="button"
                      className="flex items-center gap-1 font-semibold"
                      onClick={() => toggleSort(column)}
                    >
                      {column.header}
                      <SortIcon direction={direction} />
                    </button>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedRows.length > 0 ? (
              pagedRows.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column.accessorKey} className={column.meta?.className}>
                      {column.cell ? column.cell({ row: { original: row } }) : String(getRawValue(row, column) ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-slate-500">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-sm text-slate-500">
          Showing {pagedRows.length} of {sortedData.length} filtered rows
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={String(rowsPerPage)}
            onValueChange={(value) => setRowsPerPage(Number(value))}
          >
            <SelectTrigger className="h-8 w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}/page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={() => setCurrentPage(0)} disabled={safePage === 0}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentPage((p) => Math.max(0, p - 1))} disabled={safePage === 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Page {safePage + 1} of {pageCount}</span>
            <span>|</span>
            <span>Go to</span>
            <input
              type="number"
              min={1}
              max={pageCount}
              value={pageInput}
              onChange={(event) => setPageInput(event.target.value)}
              onBlur={() => {
                const value = Number(pageInput);
                if (!Number.isFinite(value)) {
                  setPageInput(String(safePage + 1));
                  return;
                }
                setCurrentPage(Math.min(Math.max(1, Math.floor(value)), pageCount) - 1);
              }}
              className="h-8 w-16 rounded-md border border-slate-200 px-2"
            />
          </div>

          <Button variant="outline" size="icon" onClick={() => setCurrentPage((p) => Math.min(pageCount - 1, p + 1))} disabled={safePage >= pageCount - 1}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentPage(pageCount - 1)} disabled={safePage >= pageCount - 1}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ExcelStyleDataTable;
