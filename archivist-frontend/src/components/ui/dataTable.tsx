import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type ExcelColumnDef<TData> = {
  accessorKey: keyof TData | string;
  header: React.ReactNode;
  cell?: (context: { row: { original: TData } }) => React.ReactNode;
  meta?: {
    className?: string;
    headerClassName?: string;
    filterVariant?: "text" | "select" | "none";
    filterPlaceholder?: string;
    filterOptions?: { label: string; value: string }[];
    getOptionLabel?: (row: TData) => string;
    getFilterValue?: (row: TData) => string;
  };
  // Allow page-level column configs without enforcing behaviour in this lightweight table.
  [key: string]: unknown;
};

type ExcelStyleDataTableProps<TData> = {
  columns: ExcelColumnDef<TData>[];
  data: TData[];
  pageSize?: number;
  emptyMessage?: string;
};

function getCellValue<TData>(row: TData, accessorKey: keyof TData | string) {
  if (typeof accessorKey !== "string") {
    return row[accessorKey];
  }

  return (row as Record<string, unknown>)[accessorKey];
}

export function ExcelStyleDataTable<TData>({
  columns,
  data,
  pageSize = 10,
  emptyMessage = "No results.",
}: ExcelStyleDataTableProps<TData>) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(pageSize);

  React.useEffect(() => {
    setRowsPerPage(pageSize);
  }, [pageSize]);

  React.useEffect(() => {
    const totalPages = Math.max(Math.ceil(data.length / rowsPerPage), 1);
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, data.length, rowsPerPage]);

  const totalPages = Math.max(Math.ceil(data.length / rowsPerPage), 1);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const pageRows = data.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, idx) => (
                <TableHead
                  key={`${String(column.accessorKey)}-${idx}`}
                  className={column.meta?.headerClassName}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {pageRows.length ? (
              pageRows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column, columnIndex) => {
                    const content = column.cell
                      ? column.cell({ row: { original: row } })
                      : String(getCellValue(row, column.accessorKey) ?? "—");

                    return (
                      <TableCell
                        key={`${String(column.accessorKey)}-${columnIndex}`}
                        className={column.meta?.className}
                      >
                        {content}
                      </TableCell>
                    );
                  })}
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

      <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <div>
          Showing {pageRows.length} of {data.length} rows
        </div>

        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <Select
            value={String(rowsPerPage)}
            onValueChange={(value) => {
              setRowsPerPage(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
            disabled={currentPage <= 1}
          >
            Prev
          </Button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ExcelStyleDataTable;
