# Usage Guide

This guide explains how to use the Archivist application day-to-day — from first login to managing your records.

---

## Table of Contents

- [Getting Started](#getting-started)
  - [First Launch (Desktop App)](#first-launch-desktop-app)
  - [Logging In](#logging-in)
  - [Changing Your Password](#changing-your-password)
- [Dashboard](#dashboard)
- [Core Concepts](#core-concepts)
- [Managing Retention Codes](#managing-retention-codes)
  - [Retention Period Types](#retention-period-types)
  - [Creating a Retention Code](#creating-a-retention-code)
  - [Categories](#categories)
  - [Editing and Deleting Codes](#editing-and-deleting-codes)
- [Managing Locations](#managing-locations)
- [Managing Folders](#managing-folders)
  - [Creating a Folder](#creating-a-folder)
  - [Assigning Folders to Boxes](#assigning-folders-to-boxes)
  - [Bulk Assign Folders](#bulk-assign-folders)
  - [Printing Folder Labels](#printing-folder-labels)
- [Managing Boxes](#managing-boxes)
  - [Creating a Box](#creating-a-box)
  - [Assigning Boxes to Locations](#assigning-boxes-to-locations)
  - [Box Expiry Status](#box-expiry-status)
  - [Printing Box Labels](#printing-box-labels)
- [Search](#search)
  - [Filtering Results](#filtering-results)
  - [Pinning Results](#pinning-results)
- [Importing Data](#importing-data)
  - [Import Retention Codes](#import-retention-codes)
  - [Import Locations](#import-locations)
  - [Import Folders](#import-folders)
  - [Import Boxes](#import-boxes)
  - [Import Users (Admin)](#import-users-admin)
- [User Management (Admin)](#user-management-admin)
- [Settings](#settings)
- [Typical Workflow](#typical-workflow)

---

## Getting Started

### First Launch (Desktop App)

If using the Tauri desktop app, the first screen you see is the **Server Setup** screen. Enter the address and port of the server running the Archivist backend, then click **Test Connection**. Once the connection is confirmed, click **Connect** to proceed to the login page.

If using the web version in a browser, navigate directly to the URL where the frontend is hosted (e.g. `http://localhost:5173` for development).

### Logging In

On the login screen, enter your **Username** and **Password**. The default administrator account created on first installation is:

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin` |

> **Important:** Change the default admin password immediately after first login.

### Changing Your Password

If an administrator has reset your password or marked it as temporary, you will be redirected to the **Change Password** screen automatically after login. Enter your current password and choose a new one.

---

## Dashboard

The **Dashboard** is the home page you see after logging in. It provides an at-a-glance overview of your archive system with the following metrics:

| Card | Description |
|------|-------------|
| **Total Folders** | Total number of record folders in the system |
| **Total Boxes** | Total number of physical boxes |
| **Retention Codes** | Number of defined retention code rules |
| **Locations** | Number of registered storage locations |
| **Unassigned Folders** | Folders not yet placed in a box |
| **Expiring Soon** | Folders whose retention period expires within 365 days |
| **Expired** | Folders that have already passed their expiry date — **action required** |

If the **Expired** count is above zero, the card shows an "Action Required" badge. Review these folders to arrange their disposal.

---

## Core Concepts

Understanding these concepts is key to using Archivist effectively:

| Concept | Description |
|---------|-------------|
| **Retention Code** | A rule that defines how long a type of record should be kept. Codes belong to categories and specify a period in years, months, a fixed date, or "permanent". |
| **Folder** | The smallest unit of record in the system. Each folder is assigned a retention code, which determines its expiry date. Folders are given an auto-generated **Retention ID** (e.g. `F2026-0001-HR01`). |
| **Box** | A physical container that holds one or more folders. Boxes have an auto-generated **Code** (e.g. `B2026-0001`). A box's expiry date is automatically calculated as the earliest expiry among its folders. |
| **Location** | A physical storage site (e.g. a room, shelf, or warehouse). Locations are classified as either **On-site** or **Off-site**. |
| **Category** | An organizational grouping for retention codes (e.g. "Human Resources", "Finance"). Categories can have subcategories. |

The hierarchy works like this:

```
Location
  └── Box
        └── Folder (has a Retention Code → determines expiry)
```

---

## Managing Retention Codes

Navigate to **Retention Codes** in the sidebar.

### Retention Period Types

When creating a retention code, you specify how long records should be kept. There are four types:

| Type | How to set | Example |
|------|-----------|---------|
| **Years** | Enter a whole number in the **Period (years)** field | `7` → records expire 7 years after their start date |
| **Months** | Enter a decimal in the **Period** field (converted to months) | `1.5` → records expire 18 months after start date |
| **Fixed Date** | Enter a specific date in the **Date** field | `2030-12-31` → all records with this code expire on that date |
| **Permanent** | Enter `-1` in the **Period** field | Records never expire |

### Creating a Retention Code

1. Click the **New Code** button at the top of the page.
2. Fill in the form:
   - **Category** — Select an existing category from the dropdown.
   - **Code** — A short identifier (e.g. `HR01`, `FIN03`). Must be unique.
   - **Name** — A human-readable name (e.g. "Employee Records").
   - **Description** — Details about what this code covers.
   - **Period Description** — A plain-English explanation of the retention period (e.g. "7 years from date of termination").
   - **Period (years)** — The retention period in years. Use `-1` for permanent.
   - **Period (months)** — Alternatively, the retention period in months.
   - **Date** — A fixed expiry date (overrides period fields).
3. Click **Create**.

### Categories

Categories group related retention codes. To create a new category:

1. Click **New Category** on the Retention Codes page.
2. Enter the category **Name**.
3. Optionally select a **Parent Category** to make it a subcategory.
4. Click **Create**.

### Editing and Deleting Codes

- Click the **pencil icon** next to a code to edit its name, description, or period description.
- Click the **trash icon** to delete a code. Codes that are in use by existing folders cannot be deleted.

---

## Managing Locations

Navigate to **Locations** in the sidebar.

Locations represent physical storage sites. Each location has:

- **Code** — A short identifier (e.g. `RM101`, `WH-A`).
- **Description** — A human-readable name (e.g. "Room 101, Building A").
- **Type** — Either **On-site** (local storage) or **Off-site** (remote/archival storage).

### Creating a Location

1. Click **New Location**.
2. Enter the **Code**, **Description**, and select whether it is **On-site** or **Off-site**.
3. Click **Create**.

### Editing and Deleting

- Click the **pencil icon** to edit a location's details.
- Click the **trash icon** to delete a location.

---

## Managing Folders

Navigate to **Folders** in the sidebar.

Folders represent individual records or groups of documents. Each folder is assigned a retention code, which determines when it expires.

### Creating a Folder

1. Click **New Folder**.
2. Fill in:
   - **Retention Code** — Select from the dropdown. This determines the expiry calculation.
   - **Name** — A descriptive name for the folder (e.g. "John Smith - Employment File").
   - **Start Date** — The date from which the retention period begins (e.g. date of termination, end of financial year).
3. Click **Create**.

The system automatically:
- Generates a **Retention ID** in the format `F<year>-<sequence>-<code>` (e.g. `F2026-0001-HR01`).
- Calculates the **Expiry Date** based on the retention code's period and the start date.

### Assigning Folders to Boxes

Folders can be assigned to a physical box:

1. Click the **box icon** next to the folder you want to assign.
2. Select a box from the dropdown.
3. Click **Assign**.

To remove a folder from its box, click the **unassign** button.

### Bulk Assign Folders

To assign multiple folders to the same box at once:

1. Select folders by clicking the **checkboxes** in the table.
2. Click **Assign Selected to Box** in the action bar that appears.
3. Choose a box from the dropdown.
4. Click **Assign**.

### Printing Folder Labels

To generate printable labels for folders:

1. Select the folders you want labels for using the checkboxes.
2. Click the **Print Labels** button (printer icon) in the action bar.
3. A `.docx` file is downloaded containing the labels ready for printing.

### Table Features

The folders table supports:

- **Sorting** — Click any column header to sort ascending/descending.
- **Filtering** — Click the filter icon on a column header to filter by specific values (Excel-style multi-value filtering).
- **Expiry indicators** — Folders are color-coded:
  - **Red** ("Expired") — Past their expiry date.
  - **Orange** ("Expiring Soon") — Expiring within 365 days.
  - **Green** ("Permanent") — No expiry date.

---

## Managing Boxes

Navigate to **Boxes** in the sidebar.

Boxes represent physical containers that hold folders.

### Creating a Box

1. Click **New Box**.
2. Enter a **Name** for the box (e.g. "HR Records 2024 Q1").
3. Optionally select a **Location** to assign it immediately.
4. Click **Create**.

The system automatically generates a **Box Code** in the format `B<year>-<sequence>` (e.g. `B2026-0001`).

### Assigning Boxes to Locations

Boxes can be assigned to a storage location:

1. Click the **pencil icon** to edit a box.
2. Select a **Location** from the dropdown.
3. Click **Save**.

To bulk-assign multiple boxes:

1. Select boxes using the checkboxes.
2. Click **Assign Selected to Location** in the action bar.
3. Choose a location and confirm.

### Box Expiry Status

A box's expiry date is automatically calculated as the **earliest expiry date** among all its folders. The boxes table shows expiry status:

- **Red badge** — All folders in the box have expired.
- **Orange badge** — Some folders have expired, others have not.
- **Default** — No folders have expired.

### Printing Box Labels

Select boxes using the checkboxes and click the **Print Labels** button to download a `.docx` file with printable box labels.

---

## Search

Navigate to **Search** in the sidebar.

The search page lets you find any record across the entire system — folders, boxes, retention codes, locations, and users.

### Filtering Results

- **Text search** — Type in the search box to filter results by name, code, ID, or description.
- **Type filter** — Click the type buttons (Folder, Box, Code, Location, User) to narrow results to a specific type, or select "All" to show everything.
- **Date filters** — Use the **Created** and **Expiry** date range fields to filter by date.

### Pinning Results

Click the **pin icon** next to any search result to pin it to the top of the list. Pinned results persist across sessions (stored in your browser's local storage). Drag pinned items to reorder them. Click the pin icon again to unpin.

---

## Importing Data

Navigate to **Import** in the sidebar.

The import page lets you bulk-import data from Excel files (`.xlsx` or `.xlsm`). This is useful for migrating existing records into Archivist.

> **Note:** Duplicate entries (matching by code or name) are automatically skipped during import.

### Import Retention Codes

Upload an Excel file with the following columns:

| Column | Required | Description |
|--------|----------|-------------|
| `Code` | Yes | Unique code identifier (e.g. `HR01`) |
| `Name` | No | Human-readable name |
| `Category` | No | Category name (created automatically if it doesn't exist) |
| `Sub-Category` | No | Subcategory name (created under the category) |
| `Description` | No | What the code covers |
| `Retention Description` | No | Plain-English retention period explanation |
| `Retention Period` | No | Number of years (use `-1` for permanent, decimals for months, e.g. `1.5` = 18 months) |
| `Retention Date` | No | Fixed expiry date (used if Retention Period is empty) |

### Import Locations

Upload an Excel file with the following columns:

| Column | Required | Description |
|--------|----------|-------------|
| `Code` | Yes | Unique location code (e.g. `RM101`) |
| `Description` | No | Location description |
| `On Site` | No | `TRUE` for on-site, `FALSE` for off-site (defaults to on-site) |

### Import Folders

Upload an Excel file with the following columns:

| Column | Required | Description |
|--------|----------|-------------|
| `Code` | Yes | Retention code to apply (must already exist in the system) |
| `Name` | Yes | Folder name |
| `Start Date` | Yes | Date the retention period begins |

The system automatically generates Retention IDs and calculates expiry dates based on the matched retention code.

Optionally, check **"Include generated retention IDs in results"** before importing to see the auto-generated IDs in the import summary.

### Import Boxes

Upload an Excel file with the following columns:

| Column | Required | Description |
|--------|----------|-------------|
| `Name` | Yes | Box name (must be unique) |
| `Retention IDs` or `Folders` | No | Comma- or semicolon-separated list of folder Retention IDs to assign to this box |

If folder Retention IDs are provided, those folders are automatically assigned to the new box and the box's expiry date is calculated accordingly.

### Import Users (Admin)

Admin users can bulk-import user accounts. Upload an Excel file with:

| Column | Required | Description |
|--------|----------|-------------|
| `Username` | Yes | Unique username |
| `Email` | Yes | Unique email address |
| `Password` | Yes | Initial password |
| `Full Name` | No | Display name |
| `Is Admin` | No | `true`/`yes`/`1` to grant admin access (default: no) |
| `Is Active` | No | `false`/`no`/`0` to create a disabled account (default: active) |

---

## User Management (Admin)

Navigate to **Users** in the sidebar (visible only to admins).

The Users page allows administrators to:

- **Create users** — Click **New User** and fill in username, email, password, full name, and role (admin or standard user).
- **Change roles** — Click the **shield icon** next to a user to toggle between Admin and User roles.
- **Reset passwords** — Click the **key icon** to set a new password for a user. The user will be prompted to change it on next login.
- **Delete users** — Click the **trash icon** to remove a user account. You cannot delete your own account or the last remaining active admin.

---

## Settings

Navigate to **Settings** in the sidebar.

The Settings page shows:

- **Account** — Your username, email, full name, and role.
- **API Connection** — The backend server URL and connection status (Connected / Offline). In the Tauri desktop app, you can change the server URL here.
- **System Information** — Application version and environment details.
- **Clear Database** (Admin only) — A destructive action that removes all data from the database. Type the confirmation phrase to proceed. **Use with extreme caution.**

---

## Typical Workflow

Here is a recommended workflow for setting up and using Archivist:

### Initial Setup

1. **Log in** with the default admin account (`admin` / `admin`).
2. **Change the admin password** immediately.
3. **Create users** for your team via the Users page or by importing a spreadsheet.
4. **Set up retention codes** — either create them manually or import from an Excel file. These define your organization's record retention rules.
5. **Set up locations** — add your physical storage locations (rooms, shelves, warehouses).

### Day-to-Day Usage

1. **Create folders** as new records come in. Select the appropriate retention code and enter the start date.
2. **Create boxes** when you need to physically store folders together.
3. **Assign folders to boxes** — use individual or bulk assignment.
4. **Assign boxes to locations** — track where each box is stored.
5. **Print labels** for boxes and folders as needed.

### Ongoing Maintenance

1. **Check the dashboard** regularly for expired and expiring-soon records.
2. **Search** for specific records when needed.
3. **Review expired folders** and arrange their disposal according to your organization's policies.
4. **Import new data** in bulk when migrating records from other systems.
