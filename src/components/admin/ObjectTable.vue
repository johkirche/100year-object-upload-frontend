<template>
  <div class="w-full">
    <div class="flex items-center py-4">
      <Input
        class="max-w-sm"
        placeholder="Nach Namen filtern..."
        :model-value="table.getColumn('name')?.getFilterValue() as string"
        @update:model-value="table.getColumn('name')?.setFilterValue($event)"
      />
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" class="ml-auto">
            Spalten <ChevronDown class="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuCheckboxItem
            v-for="column in table.getAllColumns().filter((column: any) => column.getCanHide())"
            :key="column.id"
            class="capitalize"
            :model-value="column.getIsVisible()"
            @update:model-value="(value: boolean) => {
              column.toggleVisibility(!!value)
            }"
          >
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
              <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header" :props="header.getContext()" />
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
                  <slot 
                    name="expanded-row" 
                    :row="row" 
                    :updateAnmerkung="updateAnmerkung" 
                    :updateBewertung="updateBewertung"
                  />
                </TableCell>
              </TableRow>
            </template>
          </template>

          <TableRow v-else>
            <TableCell
              :colspan="columns.length"
              class="h-24 text-center"
            >
              Keine Ergebnisse.
            </TableCell>
          </TableRow>
        </TableBody>
      </TableComponent>
    </div>

    <div class="flex items-center justify-end space-x-2 py-4">
      <div class="space-x-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="!table.getCanPreviousPage()"
          @click="table.previousPage()"
        >
          Vorherige
        </Button>
        <Button
          variant="outline"
          size="sm"
          :disabled="!table.getCanNextPage()"
          @click="table.nextPage()"
        >
          Nächste
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ColumnDef } from '@tanstack/vue-table'
import type { ItemsObjekt } from '@/client/types.gen'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
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
import { ChevronDown } from 'lucide-vue-next'

defineProps<{
  table: any,
  columns: ColumnDef<ItemsObjekt>[],
  getFileType: (fileData: any) => 'image' | 'pdf' | 'video' | 'audio' | 'document' | 'other',
  getFileName: (fileData: any) => string,
  getImageThumbnailUrl: (fileData: any, width?: number, height?: number) => string,
  openAssetUrl: (fileData: any, download?: boolean) => void
}>()

const emit = defineEmits<{
  'updateAnmerkung': [objekt: ItemsObjekt, value: string],
  'updateBewertung': [objekt: ItemsObjekt, value: number]
}>()

const updateAnmerkung = (objekt: ItemsObjekt, value: string) => {
  emit('updateAnmerkung', objekt, value)
}

const updateBewertung = (objekt: ItemsObjekt, value: number) => {
  emit('updateBewertung', objekt, value)
}
</script> 