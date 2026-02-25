<template>
  <div class="w-full">
    <div class="flex items-center py-4">
      <slot name="search-bar" />
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" class="ml-auto">
            Spalten
            <ChevronDown class="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuCheckboxItem v-for="column in table.getAllColumns().filter((column: any) => column.getCanHide())"
            :key="column.id" class="capitalize" :model-value="column.getIsVisible()" @update:model-value="(value: boolean) => {
              column.toggleVisibility(!!value)
            }">
            {{ column.id }}
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <div class="rounded-md border">
      <TableComponent>
        <TableHeader>
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <TableHead v-for="header in headerGroup.headers" :key="header.id">
              <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header"
                :props="header.getContext()" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <template v-for="row in table.getRowModel().rows" :key="row.id">
              <TableRow :data-state="row.getIsSelected() && 'selected'">
                <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                  <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                </TableCell>
              </TableRow>
              <TableRow v-if="row.getIsExpanded()">
                <TableCell :colspan="row.getAllCells().length">
                  <slot name="expanded-row" :row="row" :update-anmerkung="updateAnmerkung"
                    :update-bewertung="updateBewertung" :update-categories="updateCategories"
                    :delete-object="deleteObject" />
                </TableCell>
              </TableRow>
            </template>
          </template>

          <TableRow v-else>
            <TableCell :colspan="columns.length" class="h-24 text-center">
              Keine Ergebnisse.
            </TableCell>
          </TableRow>
        </TableBody>
      </TableComponent>
    </div>

    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      <!-- Items per page selector -->
      <div class="flex items-center gap-2 text-sm">
        <span class="text-muted-foreground whitespace-nowrap">Pro Seite:</span>
        <Select :model-value="String(table.getState().pagination.pageSize)" @update:model-value="handlePageSizeChange">
          <SelectTrigger class="w-[70px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="size in pageSizeOptions" :key="size" :value="String(size)">
              {{ size }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Page navigation -->
      <div class="flex items-center gap-1">
        <Button variant="outline" size="icon" class="h-8 w-8" :disabled="!table.getCanPreviousPage()"
          @click="table.setPageIndex(0)">
          <ChevronsLeft class="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" class="h-8 w-8" :disabled="!table.getCanPreviousPage()"
          @click="table.previousPage()">
          <ChevronLeft class="h-4 w-4" />
        </Button>

        <template v-for="page in visiblePages" :key="page">
          <Button v-if="page === '...'" variant="ghost" size="icon" class="h-8 w-8" disabled>
            ...
          </Button>
          <Button v-else
            :variant="page === table.getState().pagination.pageIndex + 1 ? 'default' : 'outline'"
            size="icon" class="h-8 w-8" @click="table.setPageIndex((page as number) - 1)">
            {{ page }}
          </Button>
        </template>

        <Button variant="outline" size="icon" class="h-8 w-8" :disabled="!table.getCanNextPage()"
          @click="table.nextPage()">
          <ChevronRight class="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" class="h-8 w-8" :disabled="!table.getCanNextPage()"
          @click="table.setPageIndex(table.getPageCount() - 1)">
          <ChevronsRight class="h-4 w-4" />
        </Button>
      </div>

      <!-- Info text -->
      <div class="text-sm text-muted-foreground whitespace-nowrap">
        {{ paginationStart }}–{{ paginationEnd }} von {{ totalItems }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import type { ItemsObjekt } from '@/client/types.gen'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FlexRender,
} from '@tanstack/vue-table'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next'

const props = defineProps<{
  table: any,
  columns: ColumnDef<ItemsObjekt>[],
  totalItems: number,
  getFileType: (fileData: any) => 'image' | 'pdf' | 'video' | 'audio' | 'document' | 'other',
  getFileName: (fileData: any) => string,
  getImageThumbnailUrl: (fileData: any, width?: number, height?: number) => string,
  openAssetUrl: (fileData: any, download?: boolean) => void
}>()

const pageSizeOptions = [10, 20, 50, 100]

const handlePageSizeChange = (value: any) => {
  props.table.setPageSize(Number(value))
}

const visiblePages = computed(() => {
  const total = props.table.getPageCount()
  const current = props.table.getState().pagination.pageIndex + 1
  const pages: (number | string)[] = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
    return pages
  }

  pages.push(1)
  if (current > 3) pages.push('...')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push('...')
  pages.push(total)

  return pages
})

const paginationStart = computed(() => {
  const { pageIndex, pageSize } = props.table.getState().pagination
  return pageIndex * pageSize + 1
})

const paginationEnd = computed(() => {
  const { pageIndex, pageSize } = props.table.getState().pagination
  return Math.min((pageIndex + 1) * pageSize, props.totalItems)
})

const emit = defineEmits<{
  'update-anmerkung': [objekt: ItemsObjekt, value: string],
  'update-bewertung': [objekt: ItemsObjekt, value: number, label: string],
  'update-categories': [objekt: ItemsObjekt, categories: string[]],
  'delete-object': [objekt: ItemsObjekt]
}>()

const updateAnmerkung = (objekt: ItemsObjekt, value: string) => {
  emit('update-anmerkung', objekt, value)
}

const updateBewertung = (objekt: ItemsObjekt, value: number, label: string) => {
  emit('update-bewertung', objekt, value, label)
}

const updateCategories = (objekt: ItemsObjekt, categories: string[]) => {
  emit('update-categories', objekt, categories)
}

const deleteObject = (objekt: ItemsObjekt) => {
  emit('delete-object', objekt)
}
</script>