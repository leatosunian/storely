import * as React from "react"

import { cn } from "@/lib/utils"

const TableSmall = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-y-scroll max-h-96">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-xs", className)}
      {...props}
    />
  </div>
))
TableSmall.displayName = "Table"

const TableSmallHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableSmallHeader.displayName = "TableSmallHeader"

const TableSmallBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0 overflow-y-scroll" , className)}
    style={{ maxHeight: '200px' }}
    {...props}
  />
))
TableSmallBody.displayName = "TableSmallBody"

const TableSmallFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableSmallFooter.displayName = "TableSmallFooter"

const TableSmallRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableSmallRow.displayName = "TableSmallRow"

const TableSmallHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-9 pr-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableSmallHead.displayName = "TableSmallHead"

const TableSmallCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("py-2 pr-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableSmallCell.displayName = "TableSmallCell"

const TableSmallCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableSmallCaption.displayName = "TableSmallCaption"

export {
  TableSmall,
  TableSmallHeader,
  TableSmallBody,
  TableSmallFooter,
  TableSmallHead,
  TableSmallRow,
  TableSmallCell,
  TableSmallCaption,
}
