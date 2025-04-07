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
- **Username Login**: Optional feature to allow simple username login without email format

#### Username Login Feature

The application supports a simplified login experience where users can enter just a username (without email format). When enabled:

1. Users can log in with a simple username instead of a full email address
2. The system automatically appends the configured email domain to the username
3. This works for both regular login and QR code auto-login
4. The login form adapts to show "Username" instead of "Email" when this feature is enabled

To enable this feature, set the following environment variables:

```
# Enable username to email feature (true/false)
VITE_ENABLE_USERNAME_TO_EMAIL=true

# Default email domain to append to usernames when not an email
VITE_DEFAULT_EMAIL_DOMAIN=example.com
```

If a user enters an email with @ symbol, it will be used as-is. If they enter just a username, the system will append `@example.com` (or your configured domain).

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

# Enable username to email feature (true/false)
VITE_ENABLE_USERNAME_TO_EMAIL=false

# Default email domain to append to usernames when not an email
VITE_DEFAULT_EMAIL_DOMAIN=example.com
```

- `VITE_DIRECTUS_URL`: URL of your Directus instance
- `VITE_ADMIN_ROLE_ID`: UUID of the admin role in Directus
- `VITE_FILE_FOLDER`: UUID of the folder in Directus where files will be stored
- `NGINX_SERVER_NAME`: Domain name for Nginx configuration (for Docker deployment)
- `LETSENCRYPT_EMAIL`: Email for Let's Encrypt SSL certificates (for Docker deployment)
- `FRONTEND_PUBLIC_PORT`: Port for the frontend application (for Docker deployment)
- `VITE_ENCRYPTION_SECRET`: Secret key for encrypting/decrypting auto-login credentials (use a strong, random string)
- `VITE_ENABLE_USERNAME_TO_EMAIL`: Enable or disable the username-to-email feature (true/false)
- `VITE_DEFAULT_EMAIL_DOMAIN`: The email domain to append to usernames when using the username-to-email feature

## Development

To start the development server:

```