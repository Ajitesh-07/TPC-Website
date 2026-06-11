import { cn } from "@/lib/utils";

export interface Column<T> {
  header?: React.ReactNode;
  /** Render a cell for the given row. */
  render: (row: T, index: number) => React.ReactNode;
  /** Extra classes for this column's <td>. */
  className?: string;
  /** Extra classes for this column's <th>. */
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  /** <table> classes. */
  className?: string;
  /** <thead> <tr> classes. */
  theadClassName?: string;
  /** Default classes applied to every <th>. */
  thClassName?: string;
  /** Default classes applied to every <td>. */
  tdClassName?: string;
  /** Per-row <tr> classes (e.g. striping / hover). */
  rowClassName?: (row: T, index: number) => string;
  /** Scroll wrapper classes. */
  wrapperClassName?: string;
}

/**
 * Generic, column-config driven table. Each page supplies its own columns
 * (with `render` functions) and styling, so the markup stays in one place.
 */
export default function DataTable<T>({
  columns,
  rows,
  className,
  theadClassName,
  thClassName,
  tdClassName,
  rowClassName,
  wrapperClassName,
}: DataTableProps<T>) {
  return (
    <div className={cn("overflow-x-auto", wrapperClassName)}>
      <table className={cn("w-full text-left border-collapse", className)}>
        <thead>
          <tr className={theadClassName}>
            {columns.map((col, i) => (
              <th key={i} className={cn(thClassName, col.headerClassName)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowClassName?.(row, rowIndex)}>
              {columns.map((col, colIndex) => (
                <td key={colIndex} className={cn(tdClassName, col.className)}>
                  {col.render(row, rowIndex)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
