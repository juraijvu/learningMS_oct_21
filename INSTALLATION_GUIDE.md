# Learning Management System - Installation & Deployment Guide

This guide covers how to install and run the Learning Management System application in two environments:
1. **Localhost (Development Environment)**
2. **IIS Server (Windows Production Environment)**

---

## Table of Contents
- [Prerequisites](#prerequisites)
- [Localhost Installation](#localhost-installation)
- [IIS Server Deployment](#iis-server-deployment)
- [Database Configuration](#database-configuration)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js** (v18 or higher) - [Download from nodejs.org](https://nodejs.org)
- **npm** (comes with Node.js)
- **PostgreSQL** (v14 or higher) - [Download from postgresql.org](https://www.postgresql.org/download/)

### Verify Installation
```bash
node --version    # Should show v18.x or higher
npm --version     # Should show 9.x or higher
psql --version    # Should show PostgreSQL 14.x or higher
```

---

## Localhost Installation

### Step 1: Clone or Extract the Project

```bash
# If using git
git clone <repository-url>
cd <project-folder>

# Or extract the ZIP file and navigate to the project folder
cd learning-management-system
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Express.js (backend server)
- React + Vite (frontend)
- PostgreSQL drivers
- All UI components and utilities

### Step 3: Set Up PostgreSQL Database

#### Option A: Using Local PostgreSQL

1. **Start PostgreSQL service**
   ```bash
   # Windows (if installed as service)
   net start postgresql
   
   # macOS
   brew services start postgresql
   
   # Linux
   sudo systemctl start postgresql
   ```

2. **Create a database**
   ```bash
   # Open PostgreSQL terminal
   psql -U postgres
   
   # Create database
   CREATE DATABASE lms_db;
   
   # Create user (optional)
   CREATE USER lms_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE lms_db TO lms_user;
   
   # Exit
   \q
   ```

3. **Create `.env` file in project root**
   ```env
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/lms_db
   PGHOST=localhost
   PGPORT=5432
   PGUSER=postgres
   PGPASSWORD=your_password
   PGDATABASE=lms_db
   ```

#### Option B: Using Neon (Cloud PostgreSQL)

1. Create account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Create `.env` file:
   ```env
   DATABASE_URL=postgresql://username:password@host/database?sslmode=require
   ```

### Step 4: Apply Database Migrations

```bash
npm run db:push
```

This creates all necessary tables (users, courses, class materials, etc.)

### Step 5: Seed Demo Users

```bash
npx tsx server/seed.ts
```

This creates demo accounts:
- **Admin**: username: `admin`, password: `admin123`
- **Trainer**: username: `trainer1`, password: `trainer123`
- **Sales**: username: `sales1`, password: `sales123`
- **Student**: username: `student1`, password: `student123`

### Step 6: Start the Application

```bash
npm run dev
```

The application will start on **http://localhost:5000**

- Backend API: http://localhost:5000/api
- Frontend: http://localhost:5000

### Step 7: Access the Application

Open your browser and navigate to:
```
http://localhost:5000
```

Log in with any of the demo credentials above.

---

## IIS Server Deployment

### Prerequisites for IIS

1. **Windows Server 2016 or higher** (or Windows 10/11 with IIS enabled)
2. **IIS 10.0 or higher** installed
3. **Node.js** installed on the server
4. **PostgreSQL** installed and configured
5. **URL Rewrite Module** - [Download here](https://www.iis.net/downloads/microsoft/url-rewrite)
6. **Application Request Routing (ARR)** - [Download here](https://www.iis.net/downloads/microsoft/application-request-routing)

### Method 1: IIS Reverse Proxy (Recommended)

This method runs Node.js as a separate process and uses IIS to forward requests.

#### Step 1: Install Required IIS Modules

1. Download and install **URL Rewrite Module**
2. Download and install **Application Request Routing**

#### Step 2: Prepare Application Files

1. Copy your application folder to the server (e.g., `C:\inetpub\lms-app`)
2. Install dependencies:
   ```cmd
   cd C:\inetpub\lms-app
   npm install --production
   ```

#### Step 3: Configure Environment Variables

Create a `.env` file in `C:\inetpub\lms-app`:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/lms_db
PGHOST=localhost
PGPORT=5432
PGUSER=lms_user
PGPASSWORD=your_password
PGDATABASE=lms_db
NODE_ENV=production
PORT=3000
```

#### Step 4: Set Up Database

```cmd
cd C:\inetpub\lms-app
npm run db:push
npx tsx server/seed.ts
```

#### Step 5: Install PM2 for Process Management

```cmd
npm install -g pm2
npm install -g pm2-windows-startup

# Configure PM2 to start on boot
pm2-startup install
```

#### Step 6: Start Application with PM2

```cmd
cd C:\inetpub\lms-app
pm2 start server/index.ts --name lms-app --interpreter tsx
pm2 save
```

Verify it's running:
```cmd
pm2 status
# Should show lms-app as "online"

# Test locally
curl http://localhost:3000
```

#### Step 7: Configure IIS Website

1. **Open IIS Manager** (Start → Run → `inetmgr`)

2. **Create New Website**
   - Right-click **Sites** → **Add Website**
   - Site name: `LMS-App`
   - Physical path: `C:\inetpub\lms-app` (or create empty folder `C:\inetpub\wwwroot\lms`)
   - Binding:
     - Type: `http`
     - Port: `80` (or `443` for HTTPS)
     - Host name: `lms.yourdomain.com` (optional)
   - Click **OK**

3. **Set Folder Permissions**
   ```cmd
   icacls "C:\inetpub\lms-app" /grant "IIS_IUSRS:(OI)(CI)F" /T
   ```

#### Step 8: Create web.config for Reverse Proxy

Create `C:\inetpub\lms-app\web.config` (or in your IIS physical path):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="ReverseProxyToNode" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://localhost:3000/{R:1}" />
          <serverVariables>
            <set name="HTTP_X_FORWARDED_FOR" value="{REMOTE_ADDR}" />
            <set name="HTTP_X_FORWARDED_PROTO" value="http" />
          </serverVariables>
        </rule>
      </rules>
    </rewrite>
    
    <httpErrors existingResponse="PassThrough" />
  </system.webServer>
</configuration>
```

#### Step 9: Enable Proxy in ARR

1. In IIS Manager, click on **Server name** (root level)
2. Double-click **Application Request Routing Cache**
3. Click **Server Proxy Settings** on the right panel
4. Check **Enable proxy**
5. Click **Apply**

#### Step 10: Configure Application Pool

1. Select **Application Pools**
2. Find your app pool (same name as site)
3. Right-click → **Advanced Settings**
   - **.NET CLR Version**: `No Managed Code`
   - **Start Mode**: `AlwaysRunning`
   - **Idle Time-out (minutes)**: `0`
   - Click **OK**

#### Step 11: Test Deployment

1. Open browser and navigate to:
   ```
   http://localhost
   # or
   http://lms.yourdomain.com
   ```

2. You should see the login page

3. Test login with demo credentials

---

### Method 2: Using IISNode (Alternative)

If you prefer to run Node.js directly within IIS:

#### Step 1: Install IISNode

Download and install from [GitHub Releases](https://github.com/Azure/iisnode/releases):
- For 64-bit: `iisnode-full-v0.2.21-x64.msi`
- For 32-bit: `iisnode-full-v0.2.21-x86.msi`

#### Step 2: Update server/index.ts

Ensure your server listens on `process.env.PORT`:

```typescript
// The application already uses process.env.PORT || 5000
// No changes needed if this is already in place
```

#### Step 3: Create web.config

Create `web.config` in project root:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server/index.ts" verb="*" modules="iisnode" />
    </handlers>

    <rewrite>
      <rules>
        <!-- API routes -->
        <rule name="API" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="server/index.ts" />
        </rule>

        <!-- Static files -->
        <rule name="StaticContent" stopProcessing="true">
          <match url="^(assets/.*|.*\..*)" />
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" />
          </conditions>
          <action type="None" />
        </rule>

        <!-- Everything else goes to Node.js -->
        <rule name="DynamicContent">
          <match url="(.*)" />
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
          </conditions>
          <action type="Rewrite" url="server/index.ts" />
        </rule>
      </rules>
    </rewrite>

    <security>
      <requestFiltering>
        <hiddenSegments>
          <add segment="node_modules" />
          <add segment="server" />
          <add segment="iisnode" />
        </hiddenSegments>
      </requestFiltering>
    </security>

    <iisnode 
      nodeProcessCommandLine="&quot;C:\Program Files\nodejs\node.exe&quot;"
      loggingEnabled="true"
      logDirectory="iisnode"
      devErrorsEnabled="false"
    />
  </system.webServer>
</configuration>
```

#### Step 4: Configure IIS Site

Follow steps 7-10 from Method 1, but skip the reverse proxy configuration.

---

## Database Configuration

### PostgreSQL on Windows Server

#### Installation

1. Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run the installer
3. Remember the password you set for the `postgres` user
4. Default port: `5432`

#### Create Database

```cmd
# Open Command Prompt as Administrator
cd "C:\Program Files\PostgreSQL\15\bin"

# Connect to PostgreSQL
psql -U postgres

# In PostgreSQL prompt
CREATE DATABASE lms_db;
CREATE USER lms_user WITH PASSWORD 'SecurePassword123!';
GRANT ALL PRIVILEGES ON DATABASE lms_db TO lms_user;
\q
```

#### Configure Connection

Update `.env` file with production credentials:
```env
DATABASE_URL=postgresql://lms_user:SecurePassword123!@localhost:5432/lms_db
```

---

## SSL/HTTPS Configuration (Production)

### Step 1: Obtain SSL Certificate

- Purchase from SSL provider (e.g., DigiCert, Comodo)
- Or use Let's Encrypt (free) with [win-acme](https://www.win-acme.com/)

### Step 2: Install Certificate in IIS

1. Open IIS Manager
2. Click on server name (root)
3. Double-click **Server Certificates**
4. Import your certificate

### Step 3: Add HTTPS Binding

1. Select your site
2. Click **Bindings** on the right
3. Click **Add**
   - Type: `https`
   - Port: `443`
   - SSL certificate: Select your certificate
4. Click **OK**

### Step 4: Force HTTPS (Optional)

Add to `web.config`:
```xml
<rule name="Redirect to HTTPS" stopProcessing="true">
  <match url="(.*)" />
  <conditions>
    <add input="{HTTPS}" pattern="off" />
  </conditions>
  <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" />
</rule>
```

---

## Troubleshooting

### Localhost Issues

#### Port 5000 Already in Use
```bash
# Windows: Find and kill process
netstat -ano | findstr :5000
taskkill /PID <process_id> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

#### Database Connection Errors
- Verify PostgreSQL is running
- Check `.env` credentials
- Test connection:
  ```bash
  psql -U postgres -d lms_db
  ```

#### Module Not Found Errors
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

### IIS Server Issues

#### 500 Internal Server Error
- Check IIS logs: `C:\inetpub\logs\LogFiles`
- Check Node.js logs (PM2): `pm2 logs lms-app`
- Enable detailed errors temporarily in `web.config`:
  ```xml
  <iisnode devErrorsEnabled="true" />
  ```

#### Node.js Not Starting
```cmd
# Check PM2 status
pm2 status

# Restart application
pm2 restart lms-app

# View logs
pm2 logs lms-app --lines 100
```

#### 502 Bad Gateway
- Verify Node.js is running on port 3000:
  ```cmd
  netstat -ano | findstr :3000
  ```
- Check ARR proxy is enabled
- Verify `web.config` has correct port

#### Permission Errors
```cmd
# Grant IIS users full access
icacls "C:\inetpub\lms-app" /grant "IIS_IUSRS:(OI)(CI)F" /T
icacls "C:\inetpub\lms-app" /grant "IUSR:(OI)(CI)F" /T
```

#### Static Files Not Loading
- Check `web.config` rewrite rules
- Verify static file handling in IIS
- Check MIME types are configured

---

## Useful PM2 Commands

```cmd
# View all running apps
pm2 list

# View logs
pm2 logs lms-app

# Restart app
pm2 restart lms-app

# Stop app
pm2 stop lms-app

# Remove from PM2
pm2 delete lms-app

# Monitor resources
pm2 monit

# Save current configuration
pm2 save
```

---

## Production Checklist

- [ ] PostgreSQL installed and database created
- [ ] Node.js installed and verified
- [ ] Application files copied to server
- [ ] Dependencies installed (`npm install --production`)
- [ ] Environment variables configured (`.env` file)
- [ ] Database migrations applied (`npm run db:push`)
- [ ] Demo users seeded (optional)
- [ ] PM2 installed and application running
- [ ] PM2 configured to start on boot
- [ ] IIS website created
- [ ] URL Rewrite and ARR modules installed
- [ ] web.config created with reverse proxy rules
- [ ] Permissions set on application folder
- [ ] Application pool configured
- [ ] SSL certificate installed (for HTTPS)
- [ ] Firewall rules configured (ports 80/443)
- [ ] Tested login and basic functionality

---

## Demo Credentials

After running the seed script, the following accounts are available:

| Role | Username | Password |
|------|----------|----------|
| Administrator | admin | admin123 |
| Trainer | trainer1 | trainer123 |
| Sales Consultant | sales1 | sales123 |
| Student | student1 | student123 |

**Important:** Change these passwords immediately in a production environment!

---

## Support

For additional help:
- Check application logs
- Review IIS error logs
- Check PM2 logs
- Verify database connections
- Ensure all prerequisites are installed

---

## Project Structure

```
learning-management-system/
├── client/                  # React frontend
│   └── src/
│       ├── pages/          # Application pages
│       └── components/     # UI components
├── server/                 # Express backend
│   ├── index.ts           # Main server file
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   └── seed.ts            # Database seeding
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database schema
├── .env                   # Environment variables (create this)
├── package.json           # Dependencies
├── vite.config.ts        # Vite configuration
└── web.config            # IIS configuration (for deployment)
```

---

## Environment Variables Reference

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database
PGHOST=localhost
PGPORT=5432
PGUSER=your_username
PGPASSWORD=your_password
PGDATABASE=lms_db

# Application Configuration
NODE_ENV=production
PORT=3000

# Session Configuration (optional)
SESSION_SECRET=your-secret-key-here
```

---

**Last Updated:** October 2025
