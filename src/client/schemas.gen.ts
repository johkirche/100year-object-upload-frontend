// This file is auto-generated by @hey-api/openapi-ts

export const FilesSchema = {
    type: 'object',
    properties: {
        id: {
            description: 'Unique identifier for the file.',
            example: '8cbb43fe-4cdf-4991-8352-c461779cec02',
            type: 'string'
        },
        storage: {
            description: 'Where the file is stored. Either `local` for the local filesystem or the name of the storage adapter (for example `s3`).',
            example: 'local',
            type: 'string'
        },
        filename_disk: {
            description: 'Name of the file on disk. By default, Directus uses a random hash for the filename.',
            example: 'a88c3b72-ac58-5436-a4ec-b2858531333a.jpg',
            type: 'string'
        },
        filename_download: {
            description: "How you want to the file to be named when it's being downloaded.",
            example: 'avatar.jpg',
            type: 'string'
        },
        title: {
            description: 'Title for the file. Is extracted from the filename on upload, but can be edited by the user.',
            example: 'User Avatar',
            type: 'string'
        },
        type: {
            description: 'MIME type of the file.',
            example: 'image/jpeg',
            type: 'string'
        },
        folder: {
            description: 'Virtual folder where this file resides in.',
            example: null,
            oneOf: [
                {
                    type: 'string'
                },
                {
                    '$ref': '#/components/schemas/Folders'
                }
            ],
            nullable: true
        },
        uploaded_by: {
            description: 'Who uploaded the file.',
            example: '63716273-0f29-4648-8a2a-2af2948f6f78',
            oneOf: [
                {
                    type: 'string'
                },
                {
                    '$ref': '#/components/schemas/Users'
                }
            ]
        },
        created_on: {
            description: 'When the file was created.',
            example: '2019-12-03T00:10:15+00:00',
            type: 'string',
            format: 'date-time'
        },
        modified_by: {
            nullable: true,
            oneOf: [
                {
                    type: 'string',
                    format: 'uuid'
                },
                {
                    '$ref': '#/components/schemas/Users'
                }
            ]
        },
        modified_on: {
            nullable: false,
            type: 'string',
            format: 'timestamp'
        },
        charset: {
            description: 'Character set of the file.',
            example: 'binary',
            type: 'string',
            nullable: true
        },
        filesize: {
            description: 'Size of the file in bytes.',
            example: 137862,
            type: 'integer'
        },
        width: {
            description: 'Width of the file in pixels. Only applies to images.',
            example: 800,
            type: 'integer',
            nullable: true
        },
        height: {
            description: 'Height of the file in pixels. Only applies to images.',
            example: 838,
            type: 'integer',
            nullable: true
        },
        duration: {
            description: 'Duration of the file in seconds. Only applies to audio and video.',
            example: 0,
            type: 'integer',
            nullable: true
        },
        embed: {
            description: 'Where the file was embedded from.',
            example: null,
            type: 'string',
            nullable: true
        },
        description: {
            description: 'Description for the file.',
            type: 'string',
            nullable: true
        },
        location: {
            description: 'Where the file was created. Is automatically populated based on Exif data for images.',
            type: 'string',
            nullable: true
        },
        tags: {
            description: 'Tags for the file. Is automatically populated based on Exif data for images.',
            type: 'array',
            nullable: true,
            items: {
                type: 'string'
            }
        },
        metadata: {
            description: 'IPTC, Exif, and ICC metadata extracted from file',
            type: 'object',
            nullable: true
        },
        focal_point_x: {
            nullable: true,
            type: 'integer'
        },
        focal_point_y: {
            nullable: true,
            type: 'integer'
        },
        tus_id: {
            nullable: true,
            type: 'string'
        },
        tus_data: {
            nullable: true
        },
        uploaded_on: {
            description: 'When the file was last uploaded/replaced.',
            example: '2019-12-03T00:10:15+00:00',
            type: 'string',
            format: 'date-time'
        }
    },
    'x-collection': 'directus_files'
} as const;

export const FoldersSchema = {
    type: 'object',
    properties: {
        id: {
            description: 'Unique identifier for the folder.',
            example: '0cf0e03d-4364-45df-b77b-ca61f61869d2',
            type: 'string'
        },
        name: {
            description: 'Name of the folder.',
            example: 'New York',
            type: 'string'
        },
        parent: {
            description: 'Unique identifier of the parent folder. This allows for nested folders.',
            example: null,
            oneOf: [
                {
                    type: 'string'
                },
                {
                    '$ref': '#/components/schemas/Folders'
                }
            ],
            nullable: true
        }
    },
    'x-collection': 'directus_folders'
} as const;

export const RolesSchema = {
    type: 'object',
    properties: {
        id: {
            description: 'Unique identifier for the role.',
            example: '2f24211d-d928-469a-aea3-3c8f53d4e426',
            type: 'string'
        },
        name: {
            description: 'Name of the role.',
            example: 'Administrator',
            type: 'string'
        },
        icon: {
            description: "The role's icon.",
            example: 'verified_user',
            type: 'string'
        },
        description: {
            description: 'Description of the role.',
            example: 'Admins have access to all managed data within the system by default',
            type: 'string',
            nullable: true
        },
        ip_access: {
            description: 'Array of IP addresses that are allowed to connect to the API as a user of this role.',
            example: [],
            type: 'array',
            items: {
                type: 'string'
            }
        },
        enforce_tfa: {
            description: 'Whether or not this role enforces the use of 2FA.',
            example: false,
            type: 'boolean'
        },
        admin_access: {
            description: 'Admin role. If true, skips all permission checks.',
            example: false,
            type: 'boolean'
        },
        app_access: {
            description: 'The users in the role are allowed to use the app.',
            example: true,
            type: 'boolean'
        }
    },
    'x-collection': 'directus_roles'
} as const;

export const UsersSchema = {
    type: 'object',
    properties: {
        id: {
            description: 'Unique identifier for the user.',
            example: '63716273-0f29-4648-8a2a-2af2948f6f78',
            type: 'string'
        },
        role: {
            description: 'Unique identifier of the role of this user.',
            example: '2f24211d-d928-469a-aea3-3c8f53d4e426',
            oneOf: [
                {
                    type: 'string'
                },
                {
                    '$ref': '#/components/schemas/Roles'
                }
            ]
        }
    },
    'x-collection': 'directus_users'
} as const;

export const QuerySchema = {
    type: 'object',
    properties: {
        fields: {
            type: 'array',
            items: {
                type: 'string'
            },
            description: 'Control what fields are being returned in the object.',
            example: ['*', '*.*']
        },
        filter: {
            type: 'object',
            example: {
                '<field>': {
                    '<operator>': '<value>'
                }
            }
        },
        search: {
            description: 'Filter by items that contain the given search query in one of their fields.',
            type: 'string'
        },
        sort: {
            type: 'array',
            items: {
                type: 'string'
            },
            description: 'How to sort the returned items.',
            example: ['-date_created']
        },
        limit: {
            type: 'number',
            description: 'Set the maximum number of items that will be returned'
        },
        offset: {
            type: 'number',
            description: 'How many items to skip when fetching data.'
        },
        page: {
            type: 'number',
            description: 'Cursor for use in pagination. Often used in combination with limit.'
        },
        deep: {
            type: 'object',
            description: 'Deep allows you to set any of the other query parameters on a nested relational dataset.',
            example: {
                related_articles: {
                    _limit: 3
                }
            }
        }
    }
} as const;

export const x_metadataSchema = {
    type: 'object',
    properties: {
        total_count: {
            description: "Returns the total item count of the collection you're querying.",
            type: 'integer'
        },
        filter_count: {
            description: "Returns the item count of the collection you're querying, taking the current filter/search parameters into account.",
            type: 'integer'
        }
    }
} as const;

export const FieldsSchema = {
    type: 'object',
    properties: {
        id: {
            nullable: false,
            type: 'integer'
        },
        collection: {
            description: 'Unique name of the collection this field is in.',
            example: 'about_us',
            type: 'string'
        },
        field: {
            description: 'Unique name of the field. Field name is unique within the collection.',
            example: 'id',
            type: 'string'
        },
        special: {
            nullable: true,
            type: 'array',
            items: {
                type: 'string'
            }
        },
        interface: {
            nullable: true,
            type: 'string'
        },
        options: {
            nullable: true
        },
        display: {
            nullable: true,
            type: 'string'
        },
        display_options: {
            nullable: true
        },
        readonly: {
            nullable: false,
            type: 'boolean'
        },
        hidden: {
            nullable: false,
            type: 'boolean'
        },
        sort: {
            nullable: true,
            type: 'integer'
        },
        width: {
            nullable: true,
            type: 'string'
        },
        translations: {
            nullable: true
        },
        note: {
            nullable: true,
            type: 'string'
        },
        conditions: {
            nullable: true
        },
        required: {
            nullable: true,
            type: 'boolean'
        },
        group: {
            nullable: true,
            oneOf: [
                {
                    type: 'integer'
                },
                {
                    '$ref': '#/components/schemas/Fields'
                }
            ]
        },
        validation: {
            nullable: true
        },
        validation_message: {
            nullable: true,
            type: 'string'
        }
    },
    'x-collection': 'directus_fields'
} as const;

export const ItemsObjektSchema = {
    type: 'object',
    properties: {
        id: {
            nullable: false,
            type: 'integer'
        },
        status: {
            nullable: false,
            type: 'string'
        },
        user_created: {
            nullable: true,
            oneOf: [
                {
                    type: 'string',
                    format: 'uuid'
                },
                {
                    '$ref': '#/components/schemas/Users'
                }
            ]
        },
        date_created: {
            nullable: true,
            type: 'string',
            format: 'timestamp'
        },
        user_updated: {
            nullable: true,
            oneOf: [
                {
                    type: 'string',
                    format: 'uuid'
                },
                {
                    '$ref': '#/components/schemas/Users'
                }
            ]
        },
        date_updated: {
            nullable: true,
            type: 'string',
            format: 'timestamp'
        },
        name: {
            nullable: true,
            type: 'string'
        },
        datierung: {
            nullable: true,
            type: 'string'
        },
        abbildung: {
            nullable: true,
            description: 'Foto / Abbildung, auf dem das Objekt gezeigt wird',
            oneOf: [
                {
                    type: 'string',
                    format: 'uuid'
                },
                {
                    '$ref': '#/components/schemas/Files'
                }
            ]
        },
        beschreibung: {
            nullable: true,
            type: 'string'
        },
        art: {
            nullable: true,
            type: 'string'
        },
        format: {
            nullable: true,
            type: 'string'
        },
        einreicherName: {
            nullable: true,
            type: 'string'
        },
        einreicherGemeinde: {
            nullable: true,
            type: 'string'
        },
        kontaktRueckfrage: {
            nullable: true,
            type: 'string'
        },
        objektAusleihenFuerAusstellung: {
            nullable: true,
            type: 'boolean'
        },
        bewertung: {
            nullable: true,
            oneOf: [
                {
                    type: 'integer'
                },
                {
                    '$ref': '#/components/schemas/ItemsBewertungKleinerKreis'
                }
            ]
        },
        kategorie: {
            nullable: true,
            description: 'Kategorie/Überschrift zur Gruppierung von Objekten'
        },
        aktuellerStandort: {
            nullable: true,
            type: 'string'
        },
        anmerkung: {
            nullable: true,
            type: 'string'
        },
        type: {
            nullable: true,
            type: 'string'
        },
        anmerkungEinreicher: {
            nullable: true,
            type: 'string'
        },
        weitereAbbildungen: {
            nullable: true,
            description: 'Weitere Abbildungen oder ergänzende Dateien',
            type: 'array',
            items: {
                oneOf: [
                    {
                        type: 'integer'
                    },
                    {
                        '$ref': '#/components/schemas/ItemsObjektFiles'
                    }
                ]
            }
        }
    },
    'x-collection': 'objekt'
} as const;

export const ItemsBewertungKleinerKreisSchema = {
    type: 'object',
    properties: {
        id: {
            nullable: false,
            type: 'integer'
        },
        bezeichner: {
            nullable: true,
            type: 'string'
        },
        rangfolge: {
            nullable: true,
            type: 'integer'
        }
    },
    'x-collection': 'bewertungKleinerKreis'
} as const;

export const ItemsObjektFilesSchema = {
    type: 'object',
    properties: {
        id: {
            nullable: false,
            type: 'integer'
        },
        objekt_id: {
            nullable: true,
            oneOf: [
                {
                    type: 'integer'
                },
                {
                    '$ref': '#/components/schemas/ItemsObjekt'
                }
            ]
        },
        directus_files_id: {
            nullable: true,
            oneOf: [
                {
                    type: 'string',
                    format: 'uuid'
                },
                {
                    '$ref': '#/components/schemas/Files'
                }
            ]
        }
    },
    'x-collection': 'objekt_files'
} as const;