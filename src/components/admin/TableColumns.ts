import type { ColumnDef } from '@tanstack/vue-table'
import type { ItemsObjekt } from '@/client/types.gen'
import { Button } from '@/components/ui/button'
import { 
  ArrowUpDown, 
  ChevronUp, 
  ChevronRight, 
  FileText, 
  File, 
  Video, 
  AudioLines 
} from 'lucide-vue-next'
import { h } from 'vue'

// Helper functions for column display
type FileTypeFunction = (fileData: any) => 'image' | 'pdf' | 'video' | 'audio' | 'document' | 'other'
type FileNameFunction = (fileData: any) => string
type ThumbnailUrlFunction = (fileData: any, width?: number, height?: number) => string

export const createColumns = (
  getFileType: FileTypeFunction,
  getFileName: FileNameFunction,
  getImageThumbnailUrl: ThumbnailUrlFunction
): ColumnDef<ItemsObjekt>[] => {
  return [
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
    {
      id: 'abbildung',
      header: 'Datei',
      cell: ({ row }) => {
        const imageData = row.original.abbildung;
        if (!imageData) {
          return h('div', { class: 'w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center' }, 
            h('span', { class: 'text-gray-400 text-xs text-center' }, 'Kein Bild'));
        }
        
        const fileType = getFileType(imageData);
        
        // Handle image files
        if (fileType === 'image') {
          const thumbnailUrl = getImageThumbnailUrl(imageData, 48, 48);
          
          return h('img', {
            src: thumbnailUrl,
            class: 'w-10 h-10 object-cover rounded-md',
            alt: getFileName(imageData) || 'Objektbild',
            loading: 'lazy',
            onerror: 'this.onerror=null; this.src=\'\'; this.classList.add(\'bg-gray-100\'); this.alt=\'Bild nicht verfügbar\''
          });
        }
        
        // Handle other file types with appropriate icons
        let IconComponent = File;
        if (fileType === 'pdf') {
          IconComponent = FileText;
        } else if (fileType === 'video') {
          IconComponent = Video;
        } else if (fileType === 'audio') {
          IconComponent = AudioLines;
        } else if (fileType === 'document') {
          IconComponent = FileText;
        }
        
        return h('div', { 
          class: 'w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center',
          title: getFileName(imageData)
        }, 
          h(IconComponent, { class: 'text-gray-500 h-6 w-6' })
        );
      },
      enableSorting: false,
    },
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
      header: ({ column }) => {
        return h(Button, {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        }, () => ['Datierung', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })])
      },
      cell: ({ row }) => h('div', {}, row.getValue('datierung')),
    },
    {
      accessorKey: 'art',
      header: ({ column }) => {
        return h(Button, {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        }, () => ['Art', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })])
      },
      cell: ({ row }) => h('div', {}, row.getValue('art')),
    },
    {
      accessorKey: 'format',
      header: ({ column }) => {
        return h(Button, {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        }, () => ['Format', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })])
      },
      cell: ({ row }) => h('div', {}, row.getValue('format')),
    },
    {
      accessorKey: 'einreicherName',
      header: ({ column }) => {
        return h(Button, {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        }, () => ['Einreicher', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })])
      },
      cell: ({ row }) => h('div', {}, row.getValue('einreicherName')),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => {
        return h(Button, {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        }, () => ['Status', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })])
      },
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
      header: ({ column }) => {
        return h(Button, {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        }, () => ['Bewertung', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })])
      },
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
} 