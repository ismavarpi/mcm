# MCM

This repository contains a simple React/Node application.

## Setup

1. Install dependencies for server and client:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

2. Start the backend server:
   ```bash
   cd server
   npm start
   ```

   Configure database connection with environment variables `DB_NAME`, `DB_USER`, `DB_PASS`, and `DB_HOST`. The server uses MariaDB and will auto-create the table `Models` on startup.

3. Start the frontend React app:
   ```bash
   cd ../client
   npm start
   ```

The application shows a homepage with a header and menus. Use the administration menu (gear icon) to manage models (name and author). CRUD operations are provided via popups. Data is retrieved via REST API.
