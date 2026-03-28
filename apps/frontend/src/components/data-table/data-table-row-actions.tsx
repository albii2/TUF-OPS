'use client'

import { Row } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  viewHref?: string
  editHref?: string
  children?: React.ReactNode
}

export function DataTableRowActions<TData>({ row, viewHref, editHref, children }: DataTableRowActionsProps<TData>) {

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {viewHref && <DropdownMenuItem asChild>
            <Link href={viewHref}>View</Link>
        </DropdownMenuItem>}
        {editHref && <DropdownMenuItem asChild>
            <Link href={editHref}>Edit</Link>
        </DropdownMenuItem>}
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
