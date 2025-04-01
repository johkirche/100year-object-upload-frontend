<template>
  <div class="max-w-7xl mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">Objekte</h1>
    
    <!-- Error message -->
    <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {{ error }}
    </div>
    
    <!-- Loading state -->
    <div v-if="isLoading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
    
    <div v-else class="w-full">
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
              v-for="column in table.getAllColumns().filter((column) => column.getCanHide())"
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
        <Table>
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
                    <div class="p-4">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 class="text-lg font-semibold mb-2">Anmerkung</h3>
                          <Textarea
                            :model-value="row.original.anmerkung || ''"
                            @blur="updateAnmerkung(row.original, $event.target.value)"
                            placeholder="Anmerkung hinzufügen..."
                            class="w-full"
                          />
                        </div>
                        <div>
                          <h3 class="text-lg font-semibold mb-2">Bewertung</h3>
                          <div class="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              class="h-auto py-2 px-3 border-red-500"
                              :class="{
                                'bg-red-500 text-white': row.original.bewertung === 1
                              }"
                              @click="updateBewertung(row.original, 1)"
                            >
                              Raus
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              class="h-auto py-2 px-3 border-orange-500"
                              :class="{
                                'bg-orange-500 text-white': row.original.bewertung === 2
                              }"
                              @click="updateBewertung(row.original, 2)"
                            >
                              Raus (?)
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              class="h-auto py-2 px-3 border-yellow-500"
                              :class="{
                                'bg-yellow-500 text-white': row.original.bewertung === 6
                              }"
                              @click="updateBewertung(row.original, 6)"
                            >
                              Rein, wenn
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              class="h-auto py-2 px-3 border-teal-500"
                              :class="{
                                'bg-teal-500 text-white': row.original.bewertung === 3
                              }"
                              @click="updateBewertung(row.original, 3)"
                            >
                              Rein (?)
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              class="h-auto py-2 px-3 border-green-500"
                              :class="{
                                'bg-green-500 text-white': row.original.bewertung === 4
                              }"
                              @click="updateBewertung(row.original, 4)"
                            >
                              Rein
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              class="h-auto py-2 px-3"
                              :class="{
                                'bg-gray-300': row.original.bewertung === 7
                              }"
                              @click="updateBewertung(row.original, 7)"
                            >
                              Parking
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div class="mt-4">
                        <h3 class="text-lg font-semibold mb-2">Weitere Details</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div v-if="row.original.beschreibung" class="space-y-1">
                            <p class="font-medium">Beschreibung:</p>
                            <p>{{ row.original.beschreibung }}</p>
                          </div>
                          <div v-if="row.original.einreicherName" class="space-y-1">
                            <p class="font-medium">Einreicher:</p>
                            <p>{{ row.original.einreicherName }}</p>
                          </div>
                          <div v-if="row.original.einreicherGemeinde" class="space-y-1">
                            <p class="font-medium">Gemeinde:</p>
                            <p>{{ row.original.einreicherGemeinde }}</p>
                          </div>
                          <div v-if="row.original.kontaktRueckfrage" class="space-y-1">
                            <p class="font-medium">Kontakt für Rückfragen:</p>
                            <p>{{ row.original.kontaktRueckfrage }}</p>
                          </div>
                          <div v-if="row.original.aktuellerStandort" class="space-y-1">
                            <p class="font-medium">Aktueller Standort:</p>
                            <p>{{ row.original.aktuellerStandort }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
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
        </Table>
      </div>

      <div class="flex items-center justify-end space-x-2 py-4">
        <div class="flex-1 text-sm text-muted-foreground">
          {{ table.getFilteredSelectedRowModel().rows.length }} von
          {{ table.getFilteredRowModel().rows.length }} Objekt(en) ausgewählt.
        </div>
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
  </div>
</template>

<script setup lang="ts">
import type {
  ColumnDef,
  ColumnFiltersState,
  ExpandedState,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table'
import { valueUpdater } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FlexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import { ArrowUpDown, ChevronDown, ChevronRight, ChevronUp } from 'lucide-vue-next'
import { h, ref, onMounted, watch, computed } from 'vue'
import type { ItemsObjekt } from '@/client/types.gen'
import { useAuthStore } from '@/stores/auth'
import { readItems, updateItem } from '@directus/sdk'

// Use the Directus client from the auth store
const authStore = useAuthStore()
const directus = authStore.getClient()

// Data state
const data = ref<ItemsObjekt[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const totalItems = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)

// Define sorting state upfront to avoid reference errors
const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})
const rowSelection = ref({})
const expanded = ref<ExpandedState>({})

// Fetch data from Directus API
const fetchData = async (page = currentPage.value, itemsPerPage = pageSize.value) => {
  try {
    isLoading.value = true
    
    // Calculate offset based on page number and page size
    const offset = (page - 1) * itemsPerPage
    
    // Use Directus pagination parameters
    const [response, countResponse] = await Promise.all([
      directus.request(
        readItems('objekt', {
          fields: [
            'id',
            'name',
            'datierung',
            'art',
            'format',
            'einreicherName',
            'einreicherGemeinde',
            'kontaktRueckfrage',
            'status',
            'beschreibung',
            'anmerkung',
            'bewertung',
            'aktuellerStandort'
          ],
          limit: itemsPerPage,
          offset: offset,
          sort: sorting.value.length > 0 
            ? sorting.value.map(s => `${s.desc ? '-' : ''}${s.id}`) 
            : ['name']
        })
      ),
      // For the count, use a separate request that should be compatible with Directus v19.x
      directus.request(
        readItems('objekt', {
          limit: 1,
          meta: 'total_count'
        })
      )
    ])
    
    data.value = response as ItemsObjekt[]
    
    // Extract total count from meta if available
    // This depends on the exact structure returned by your Directus version
    const meta = (countResponse as any)?.$meta || {};
    totalItems.value = meta?.total_count || 0;
    
    isLoading.value = false
  } catch (err) {
    console.error('Error fetching objects:', err)
    error.value = 'Fehler beim Laden der Daten'
    isLoading.value = false
  }
}

// Callback when pagination or sorting changes
const handleTableChange = () => {
  // Get current page from the table
  const newPage = table.getState().pagination.pageIndex + 1
  
  // Update current page and fetch data if changed
  if (newPage !== currentPage.value) {
    currentPage.value = newPage
    fetchData(newPage, pageSize.value)
  }
}

onMounted(() => {
  // Initialize auth and fetch data
  authStore.initAuth().then(() => {
    if (authStore.isAuthenticated) {
      fetchData()
    } else {
      error.value = 'Bitte melden Sie sich an, um die Daten zu sehen'
    }
  })
})

// Watch for sorting changes to refetch data
watch(sorting, () => {
  fetchData()
}, { deep: true })

const updateAnmerkung = async (objekt: ItemsObjekt, value: string) => {
  if (objekt.id) {
    try {
      // Update directly in Directus
      await directus.request(
        updateItem('objekt', objekt.id, {
          anmerkung: value
        })
      )
      
      // Update local state
      const index = data.value.findIndex(item => item.id === objekt.id)
      if (index !== -1) {
        // Create a new array to trigger reactivity
        const newData = [...data.value]
        newData[index] = { ...newData[index], anmerkung: value }
        data.value = newData
      }

      toast({
        title: 'Anmerkung gespeichert',
        description: `Anmerkung für ${objekt.name} gespeichert`,
      })
    } catch (err) {
      console.error('Error updating anmerkung:', err)
      error.value = 'Fehler beim Speichern der Anmerkung'
    }
  }
}

import { useToast } from '@/components/ui/toast/use-toast'

const { toast } = useToast()

const updateBewertung = async (objekt: ItemsObjekt, value: number) => {
  if (objekt.id) {
    try {
      // Update directly in Directus
      await directus.request(
        updateItem('objekt', objekt.id, {
          bewertung: value
        })
      )
      
      // Update local state
      const index = data.value.findIndex(item => item.id === objekt.id)
      if (index !== -1) {
        // Create a new array to trigger reactivity
        const newData = [...data.value]
        newData[index] = { ...newData[index], bewertung: value }
        data.value = newData
      }

      toast({
        title: 'Bewertung gespeichert',
        description: `Objekt ${objekt.name} wurde mit der Bewertung ${value} gespeichert`,
      })
    } catch (err) {
      console.error('Error updating bewertung:', err)
      error.value = 'Fehler beim Speichern der Bewertung'
    }
  }
}

const columns: ColumnDef<ItemsObjekt>[] = [
  {
    id: 'expand',
    header: () => null,
    cell: ({ row }) => {
      return h(Button, {
        variant: 'ghost',
        size: 'sm',
        onClick: () => row.toggleExpanded(),
      }, () => [
        h(row.getIsExpanded() ? ChevronUp : ChevronRight, { class: 'h-4 w-4' })
      ])
    },
    enableSorting: false,
    enableHiding: false,
  },
  // {
  //   id: 'select',
  //   header: ({ table }) => h(Checkbox, {
  //     'modelValue': table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate'),
  //     'onUpdate:modelValue': value => table.toggleAllPageRowsSelected(!!value),
  //     'ariaLabel': 'Alle auswählen',
  //   }),
  //   cell: ({ row }) => h(Checkbox, {
  //     'modelValue': row.getIsSelected(),
  //     'onUpdate:modelValue': value => row.toggleSelected(!!value),
  //     'ariaLabel': 'Zeile auswählen',
  //   }),
  //   enableSorting: false,
  //   enableHiding: false,
  // },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return h(Button, {
        variant: 'ghost',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      }, () => ['Name', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })])
    },
    cell: ({ row }) => h('div', { class: 'font-medium' }, row.getValue('name')),
  },
  {
    accessorKey: 'datierung',
    header: 'Datierung',
    cell: ({ row }) => h('div', {}, row.getValue('datierung')),
  },
  {
    accessorKey: 'art',
    header: 'Art',
    cell: ({ row }) => h('div', {}, row.getValue('art')),
  },
  {
    accessorKey: 'format',
    header: 'Format',
    cell: ({ row }) => h('div', {}, row.getValue('format')),
  },
  {
    accessorKey: 'einreicherName',
    header: 'Einreicher',
    cell: ({ row }) => h('div', {}, row.getValue('einreicherName')),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string

      // make human readable
      let label = '';
      let colorClass = '';

      switch(status) {
        case 'draft':
          label = 'Entwurf';
          colorClass = 'bg-yellow-100 text-yellow-800';
          break;
        case 'uploaded':
          label = 'Formular';
          colorClass = 'bg-blue-100 text-blue-800';
          break;
        case 'back-to-author':
          label = 'Zurück zur Autorin';
          colorClass = 'bg-orange-100 text-orange-800';
          break;
        case 'published':
          label = 'Veröffentlicht';
          colorClass = 'bg-green-100 text-green-800';
          break;
        default:
          label = `Unbekannt (${status})`;
          colorClass = '';
      }

      return h('div', {
        class: `px-2 py-1 rounded-full text-xs font-medium ${colorClass} text-center`
      }, label)
    },
  },
  {
    accessorKey: 'bewertung',
    header: 'Bewertung',
    cell: ({ row }) => {
      const rating = row.getValue('bewertung') as number | null
      if (rating === null) return h('div', {
        class: 'text-center'
      }, '-')
      
      let label = '';
      let colorClass = '';
      
      switch(rating) {
        case 1:
          label = 'Raus';
          colorClass = 'bg-red-100 text-red-800';
          break;
        case 2:
          label = 'Raus (?)';
          colorClass = 'bg-orange-100 text-orange-800';
          break;
        case 3:
          label = 'Rein (?)';
          colorClass = 'bg-teal-100 text-teal-800';
          break;
        case 4:
          label = 'Rein';
          colorClass = 'bg-green-100 text-green-800';
          break;
        case 6:
          label = 'Rein, wenn';
          colorClass = 'bg-yellow-100 text-yellow-800';
          break;
        case 7:
          label = 'Parking';
          colorClass = 'bg-gray-100 text-gray-800';
          break;
        default:
          label = `Unbekannt (${rating})`;
          colorClass = '';
      }
      
      return h('div', { 
        class: `px-2 py-1 rounded-full text-xs font-medium ${colorClass} text-center`
      }, label)
    },
  },
]

// Calculate total pages for pagination
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value))

const table = useVueTable({
  get data() { return data.value },
  columns,
  getCoreRowModel: getCoreRowModel(),
  manualPagination: true, // Enable manual pagination
  get pageCount() { return totalPages.value },
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  onSortingChange: updaterOrValue => valueUpdater(updaterOrValue, sorting),
  onColumnFiltersChange: updaterOrValue => valueUpdater(updaterOrValue, columnFilters),
  onColumnVisibilityChange: updaterOrValue => valueUpdater(updaterOrValue, columnVisibility),
  onRowSelectionChange: updaterOrValue => valueUpdater(updaterOrValue, rowSelection),
  onExpandedChange: updaterOrValue => valueUpdater(updaterOrValue, expanded),
  onPaginationChange: () => handleTableChange(),
  state: {
    get sorting() { return sorting.value },
    get columnFilters() { return columnFilters.value },
    get columnVisibility() { return columnVisibility.value },
    get rowSelection() { return rowSelection.value },
    get expanded() { return expanded.value },
    get pagination() { 
      return {
        pageIndex: currentPage.value - 1,
        pageSize: pageSize.value
      }
    },
  },
})
</script> 