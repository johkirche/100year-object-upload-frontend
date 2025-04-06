# 100 Year Object Upload Frontend

This is a Vue 3 + TypeScript + Vite application for the 100 Year Object Upload project. The application allows users to upload, manage, and search for objects with associated metadata and images, integrated with a Directus CMS backend.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [Building for Production](#building-for-production)
- [Project Structure](#project-structure)
- [Authentication](#authentication)
- [Docker Deployment](#docker-deployment)

## Features

### Object Management

- **Object Upload**: Upload objects with metadata and images
- **Object Search**: Search for objects by name and description
- **Object Editing**: Edit object metadata and images
- **Object Deletion**: Delete objects and associated files
- **Pagination**: Browse objects with pagination support

### Authentication

- **User Authentication**: Login with username and password
- **Role-Based Access Control**: Different access levels for regular users and admins
- **Token Management**: Automatic token refresh and persistence

### QR Code Login

The application includes a QR code login feature that allows users to log in automatically by scanning a QR code. This is useful for situations where users need to log in quickly without typing their credentials.

#### How it works

1. Admins can generate QR codes for specific users through the QR Code Generator page
2. The QR code contains an encrypted string with the user's credentials
3. When scanned, the QR code opens a URL that automatically logs in the user

#### Usage

1. Log in as an admin
2. Click on the QR Code Generator option in the admin menu
3. Enter the username and password for the user you want to create a QR code for
4. Click "Generate QR Code"
5. The generated QR code can be:
   - Displayed on screen for scanning
   - Downloaded as an image
   - Copied as a URL

When a user scans the QR code or visits the URL, they will be automatically logged in with the provided credentials.

### Similar Objects

The application includes a feature to find and display similar objects based on search criteria. This helps users discover related items in the collection.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later)
- [pnpm](https://pnpm.io/) (v9.0.2 or later)
- [Directus](https://directus.io/) backend instance

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd 100year-object-upload-frontend
   ```

2. Install dependencies using pnpm:
   ```bash
   pnpm install
   ```

3. Create a `.env` file based on the `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Edit the `.env` file with your configuration values (see [Configuration](#configuration) section).

## Configuration

The application requires the following environment variables to be set in the `.env` file:

```
# Directus API URL
VITE_DIRECTUS_URL=https://your-directus-url

# Admin role ID
VITE_ADMIN_ROLE_ID=bace44bc-43ab-47c9-af98-2f4c154d6768

# File folder
VITE_FILE_FOLDER=dcea2d36-7cec-4479-bbd6-d5a54e432d9d

# Nginx server name
NGINX_SERVER_NAME=your-domain.com

# Let's encrypt email
LETSENCRYPT_EMAIL=your-email@example.com

# Frontend public port
FRONTEND_PUBLIC_PORT=8080

# Secret key for encrypting/decrypting auto-login credentials
VITE_ENCRYPTION_SECRET=your-secret-key
```

- `VITE_DIRECTUS_URL`: URL of your Directus instance
- `VITE_ADMIN_ROLE_ID`: UUID of the admin role in Directus
- `VITE_FILE_FOLDER`: UUID of the folder in Directus where files will be stored
- `NGINX_SERVER_NAME`: Domain name for Nginx configuration (for Docker deployment)
- `LETSENCRYPT_EMAIL`: Email for Let's Encrypt SSL certificates (for Docker deployment)
- `FRONTEND_PUBLIC_PORT`: Port for the frontend application (for Docker deployment)
- `VITE_ENCRYPTION_SECRET`: Secret key for encrypting/decrypting auto-login credentials (use a strong, random string)

## Development

To start the development server:

```bash
pnpm dev
```

This will start the Vite development server with hot module replacement. The application will be available at http://localhost:5173 by default.

### TypeScript Generation

The project uses OpenAPI TypeScript generation to create type definitions from the Directus API schema:

```bash
pnpm openapi-ts
```

This command generates TypeScript types based on the OpenAPI specification in `openapi.json`.

## Building for Production

To build the application for production:

```bash
pnpm build
```

This will create a production-ready build in the `dist` directory.

To preview the production build locally:

```bash
pnpm preview
```

## Project Structure

```
100year-object-upload-frontend/
├── public/                  # Static assets
├── src/                     # Source code
│   ├── assets/              # Project assets (images, fonts, etc.)
│   ├── client/              # API client code generated from OpenAPI
│   ├── components/          # Vue components
│   │   ├── admin/           # Admin-specific components
│   │   ├── objectupload/    # Object upload components
│   │   └── ui/              # UI components
│   ├── composables/         # Vue composables (custom hooks)
│   ├── lib/                 # Utility functions and libraries
│   ├── router/              # Vue Router configuration
│   ├── stores/              # Pinia stores for state management
│   ├── views/               # Vue components that represent pages/routes
│   ├── App.vue              # Main application component
│   ├── main.ts              # Application entry point
│   └── style.css            # Global styles
├── .env.example             # Example environment variables
├── docker-compose.yml       # Docker Compose configuration
├── Dockerfile               # Docker configuration
├── nginx.template.conf      # Nginx configuration template
├── package.json             # Project dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite configuration
```

## Authentication

The application uses Directus for authentication. Users can log in with their Directus credentials. Authentication tokens are stored in localStorage and automatically refreshed when needed.

There are two types of users:
- **Regular Users**: Can upload and view objects
- **Admins**: Have additional privileges like generating QR codes and accessing admin features

## Docker Deployment

The project includes Docker configuration for easy deployment:

1. Make sure Docker and Docker Compose are installed on your server
2. Configure the `.env` file with your production settings
3. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

This will:
- Build the frontend application
- Set up Nginx as a reverse proxy
- Configure SSL with Let's Encrypt
- Expose the application on the configured port

## License

[Include license information here]

## Contributing

[Include contributing guidelines here]
