import * as React from "react";
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type ColumnFiltersState,
    type FilterFn,
    type SortingState,
} from "@tanstack/react-table";

type FilterOption = { label: string; value: string };

declare module "@tanstack/react-table" {
  interface FilterFns {
    excelLikeMultiValue: FilterFn<unknown>;
  }
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint, @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends unknown, TValue = unknown> {
    className?: string;
    headerClassName?: string;
    filterVariant?: FilterVariant;
    filterPlaceholder?: string;
    filterOptions?: FilterOption[];
    getOptionLabel?: (row: TData) => string;
    getFilterValue?: (row: TData) => string;
  }
}
import {
    ArrowDownAZ,
    ArrowUpAZ,
    ChevronDown,
    ChevronUp,
    ChevronsUpDown,
    ListFilter,
    Search,
    ChevronsLeft,
    ChevronLeft,
    ChevronRight,
    ChevronsRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
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
import { cn } from "@/lib/utils";

type FilterVariant = "text" | "select" | "none";

type MultiValueFilter = {
    selectedValues: string[];
};

export type ExcelColumnDef<TData, TValue = unknown> = ColumnDef<TData, TValue> & {
    meta?: {
        className?: string;
        headerClassName?: string;
        filterVariant?: FilterVariant;
        filterPlaceholder?: string;
        filterOptions?: { label: string; value: string }[];
        getOptionLabel?: (row: TData) => string;
        getFilterValue?: (row: TData) => string;
    };
};

type ExcelStyleDataTableProps<TData, TValue = unknown> = {
    columns: ExcelColumnDef<TData, TValue>[];
    data: TData[];
    pageSize?: number;
    emptyMessage?: string;
    rowIdAccessor?: (row: TData, index: number) => string;
    onSelectedRowsChange?: (rows: TData[]) => void;
    selectionResetKey?: string | number;
};

const excelLikeMultiValueFilter: FilterFn<any> = (row, columnId, filterValue, _addMeta) => {
    if (
        !filterValue ||
        !Array.isArray(filterValue.selectedValues) ||
        filterValue.selectedValues.length === 0
    ) {
        return true;
    }

    const meta = row.getAllCells().find((c: any) => c.column.id === columnId)?.column.columnDef.meta;
    const getFilterValue = meta?.getFilterValue;

    let rowValue: string;
    if (typeof getFilterValue === "function") {
        rowValue = getFilterValue(row.original) ?? "";
    } else {
        const raw = row.getValue(columnId);
        rowValue = raw == null ? "" : String(raw);
    }

    return filterValue.selectedValues.includes(rowValue);
};

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
    if (sorted === "asc") return <ChevronUp className="h-4 w-4" />;
    if (sorted === "desc") return <ChevronDown className="h-4 w-4" />;
    return <ChevronsUpDown className="h-4 w-4 opacity-50" />;
}

function HeaderFilterMenu<TData>({
                                     column,
                                     title,
                                     data,
                                 }: {
    column: any;
    title: React.ReactNode;
    data: TData[];
}) {
    const meta = column.columnDef.meta;
    const filterVariant: FilterVariant = meta?.filterVariant ?? "text";

    const filterValue = column.getFilterValue() as MultiValueFilter | undefined;
    const appliedSelectedValues = React.useMemo(
        () => filterValue?.selectedValues ?? [],
        [filterValue]
    );

    const appliedSelectedKey = React.useMemo(
        () => appliedSelectedValues.join("||"),
        [appliedSelectedValues]
    );

    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const [draftSelected, setDraftSelected] = React.useState<string[]>(appliedSelectedValues);

    React.useEffect(() => {
        if (open) {
            setDraftSelected(appliedSelectedValues);
            setSearch("");
        }
    }, [open, appliedSelectedKey, appliedSelectedValues]);

    if (filterVariant === "none") {
        return (
            <div className="flex items-center gap-2">
                <span>{title}</span>
                {column.getCanSort() && <SortIcon sorted={column.getIsSorted()} />}
            </div>
        );
    }

    const options = React.useMemo(() => {
        if (meta?.filterOptions?.length) {
            return meta.filterOptions;
        }

        const values = new Map<string, string>();

        for (const row of data) {
            const rawValue = meta?.getFilterValue
                ? meta.getFilterValue(row)
                : column.accessorFn
                    ? column.accessorFn(row, 0)
                    : column.accessorKey
                        ? (row as any)[column.accessorKey]
                        : undefined;

            const value = rawValue == null ? "" : String(rawValue);
            const label = meta?.getOptionLabel ? meta.getOptionLabel(row) : value || "(Blank)";

            if (!values.has(value)) {
                values.set(value, label);
            }
        }

        return Array.from(values.entries())
            .map(([value, label]) => ({ value, label }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [data, meta, column]);

    const filteredOptions = React.useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return options;
        return options.filter((option: FilterOption) => option.label.toLowerCase().includes(q));
    }, [options, search]);

    const allVisibleSelected =
        filteredOptions.length > 0 &&
        filteredOptions.every((option: FilterOption) => draftSelected.includes(option.value));

    const someVisibleSelected =
        filteredOptions.some((option: FilterOption) => draftSelected.includes(option.value)) && !allVisibleSelected;

    const hasActiveFilter = appliedSelectedValues.length > 0;

    const toggleValue = (value: string, checked: boolean) => {
        setDraftSelected((prev) =>
            checked ? Array.from(new Set([...prev, value])) : prev.filter((v) => v !== value)
        );
    };

    const handleSelectAllVisible = (checked: boolean) => {
        if (checked) {
            setDraftSelected((prev) => {
                const merged = new Set([...prev, ...filteredOptions.map((o: FilterOption) => o.value)]);
                return Array.from(merged);
            });
        } else {
            setDraftSelected((prev) =>
                prev.filter((value) => !filteredOptions.some((o: FilterOption) => o.value === value))
            );
        }
    };

    const applyFilter = () => {
        const normalisedDraft = Array.from(new Set(draftSelected));

        if (normalisedDraft.length === 0 || normalisedDraft.length === options.length) {
            column.setFilterValue(undefined);
        } else {
            column.setFilterValue({ selectedValues: normalisedDraft });
        }

        setOpen(false);
    };

    const clearFilter = () => {
        setDraftSelected([]);
        setSearch("");
        column.setFilterValue(undefined);
        setOpen(false);
    };

    return (
        <div className="flex items-center justify-between gap-2">
            <button
                type="button"
                className="flex items-center gap-2 text-left font-semibold"
                onClick={column.getToggleSortingHandler()}
            >
                <span>{title}</span>
                {column.getCanSort() && <SortIcon sorted={column.getIsSorted()} />}
            </button>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "relative h-7 w-7 shrink-0 rounded-sm border transition-colours",
                            hasActiveFilter
                                ? "border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100"
                                : "border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        )}
                    >
                        <ListFilter className="h-4 w-4" />
                        {hasActiveFilter && (
                            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
                {appliedSelectedValues.length}
              </span>
                        )}
                    </Button>
                </PopoverTrigger>

                <PopoverContent
                    align="end"
                    className="z-50 w-[320px] border bg-white p-0 shadow-md"
                >
                    <div className="border-b p-2">
                        <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm hover:bg-slate-100"
                            onClick={() => {
                                column.toggleSorting(false);
                                setOpen(false);
                            }}
                        >
                            <ArrowUpAZ className="h-4 w-4" />
                            Sort A to Z
                        </button>

                        <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm hover:bg-slate-100"
                            onClick={() => {
                                column.toggleSorting(true);
                                setOpen(false);
                            }}
                        >
                            <ArrowDownAZ className="h-4 w-4" />
                            Sort Z to A
                        </button>

                        <button
                            type="button"
                            className="mt-1 flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={clearFilter}
                            disabled={!hasActiveFilter}
                        >
                            <ListFilter className="h-4 w-4" />
                            Clear Filter From "{String(title)}"
                        </button>
                    </div>

                    <div className="border-b p-2">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search"
                                className="pl-8"
                            />
                        </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto p-2">
                        <div
                            role="button"
                            tabIndex={0}
                            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 hover:bg-slate-100"
                            onClick={() => handleSelectAllVisible(!allVisibleSelected)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    handleSelectAllVisible(!allVisibleSelected);
                                }
                            }}
                        >
                            <Checkbox
                                checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                                onClick={(e) => e.stopPropagation()}
                                onCheckedChange={(checked) => handleSelectAllVisible(checked === true)}
                            />
                            <span className="text-sm">(Select All)</span>
                        </div>

                        {filteredOptions.map((option: FilterOption) => {
                            const checked = draftSelected.includes(option.value);

                            return (
                                <div
                                    key={option.value}
                                    role="button"
                                    tabIndex={0}
                                    className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 hover:bg-slate-100"
                                    onClick={() => toggleValue(option.value, !checked)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            toggleValue(option.value, !checked);
                                        }
                                    }}
                                >
                                    <Checkbox
                                        checked={checked}
                                        onClick={(e) => e.stopPropagation()}
                                        onCheckedChange={(nextChecked) => toggleValue(option.value, nextChecked === true)}
                                    />
                                    <span className="text-sm">{option.label}</span>
                                </div>
                            );
                        })}

                        {filteredOptions.length === 0 && (
                            <div className="px-2 py-3 text-sm text-slate-500">No matching values</div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 border-t p-2">
                        <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={applyFilter}>
                            OK
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

export function ExcelStyleDataTable<TData, TValue = unknown>({
                                                                 columns,
                                                                 data,
                                                                 pageSize = 10,
                                                                 emptyMessage = "No results.",
                                                                 rowIdAccessor,
                                                                 onSelectedRowsChange,
                                                                 selectionResetKey,
                                                             }: ExcelStyleDataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [selectedRowId, setSelectedRowId] = React.useState<string | null>(null);

    const table = useReactTable({
        data,
        columns,
        filterFns: {
            excelLikeMultiValue: excelLikeMultiValueFilter,
        },
        state: {
            sorting,
            columnFilters,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getRowId: (row, index) => resolveRowId(row, index),
        initialState: {
            pagination: {
                pageIndex: 0,
                pageSize,
            },
        },
    });

    const [pageInput, setPageInput] = React.useState("1");

    React.useEffect(() => {
        setPageInput(String(table.getState().pagination.pageIndex + 1));
    }, [table.getState().pagination.pageIndex]);

    React.useEffect(() => {
        const visibleRows = table.getRowModel().rows;
        if (!selectedRowId) {
            return;
        }
        if (!visibleRows.some((row) => row.id === selectedRowId)) {
            setSelectedRowId(null);
        }
    }, [selectedRowId, table, sorting, columnFilters]);

    const pageCount = Math.max(table.getPageCount(), 1);

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto overflow-y-visible rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                <TableHead className="w-10 px-2">
                                    <Checkbox
                                        checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                                        onCheckedChange={(checked) => handleSelectAllVisible(checked === true)}
                                        aria-label="Select all visible rows"
                                    />
                                </TableHead>
                                {headerGroup.headers.map((header) => {
                                    const meta = header.column.columnDef.meta;

                                    return (
                                        <TableHead key={header.id} className={meta?.headerClassName}>
                                            {header.isPlaceholder ? null : (
                                                <HeaderFilterMenu
                                                    column={header.column}
                                                    title={flexRender(header.column.columnDef.header, header.getContext())}
                                                    data={data}
                                                />
                                            )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className="cursor-pointer"
                                    data-state={selectedRowId === row.id ? "selected" : undefined}
                                    onClick={(event) => {
                                        const target = event.target as HTMLElement;
                                        if (target.closest("button, a, input, select, textarea, [role='button']")) {
                                            return;
                                        }
                                        setSelectedRowId((current) => (current === row.id ? null : row.id));
                                    }}
                                >
                                    {row.getVisibleCells().map((cell) => {
                                        const meta = cell.column.columnDef.meta;
                                        return (
                                            <TableCell key={cell.id} className={meta?.className}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length + 1} className="h-24 text-center text-slate-500">
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-sm text-slate-500">
                    Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length} filtered rows
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">Rows per page</span>
                        <Select
                            value={String(table.getState().pagination.pageSize)}
                            onValueChange={(value) => {
                                table.setPageSize(Number(value));
                                table.setPageIndex(0);
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
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>
                Page {table.getState().pagination.pageIndex + 1} of {pageCount}
              </span>
                            <span>|</span>
                            <span>Go to page</span>
                            <Input
                                type="number"
                                min={1}
                                max={pageCount}
                                value={pageInput}
                                onChange={(e) => setPageInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        const value = Number(pageInput);
                                        if (!Number.isNaN(value)) {
                                            const page = Math.min(Math.max(value, 1), pageCount) - 1;
                                            table.setPageIndex(page);
                                        }
                                    }
                                }}
                                onBlur={() => {
                                    const value = Number(pageInput);
                                    if (!Number.isNaN(value)) {
                                        const page = Math.min(Math.max(value, 1), pageCount) - 1;
                                        table.setPageIndex(page);
                                    } else {
                                        setPageInput(String(table.getState().pagination.pageIndex + 1));
                                    }
                                }}
                                className="h-8 w-20"
                            />
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => table.setPageIndex(pageCount - 1)}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ExcelStyleDataTable;
