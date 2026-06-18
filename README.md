# Mobile-First Cafe Ordering System (MVP)

A modern, mobile-first cafe ordering system designed for a 5-cafe MVP. Customers scan a table QR code to open the cafe's menu, add items, and place orders directly to the kitchen. Owners can generate QR codes for each table from a dedicated settings page.

---

## 📂 Project Structure

This repository is split into two main directories:

*   **`cafe-backend/`**: Express server utilizing SQLite (`better-sqlite3`) to serve cafe details, categories, items, and record orders.
*   **`cafe-frontend/`**: React application built with Vite, TypeScript, and Tailwind CSS.

---

## 🛠️ Tech Stack

### Frontend
*   **Core**: React 19, TypeScript
*   **Routing**: React Router v7
*   **Styling**: Tailwind CSS v3
*   **QR Generation**: `qrcode` library

### Backend
*   **Core**: Node.js, Express
*   **Database**: SQLite (`better-sqlite3`)
*   **Authentication**: JWT & Bcrypt (for owner dashboard protection)

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

---

### 1. Backend Setup & Run

1.  Navigate to the backend directory:
    ```bash
    cd cafe-backend/cafe-backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Seed the SQLite database with test cafes, categories, and items:
    ```bash
    npm run seed
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```
    The server will start running on port **`3001`** (`http://localhost:3001`).

---

### 2. Frontend Setup & Run

1.  Open a new terminal window and navigate to the frontend directory:
    ```bash
    cd cafe-frontend/cafe-frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Vite development server:
    ```bash
    npm run dev
    ```
    The frontend will start running on port **`5173`** (`http://localhost:5173`).

---

## 📱 Features & Routes

### Customer Menu Flow
*   **Route**: `/menu/:cafeSlug` (e.g. `http://localhost:5173/menu/chai-corner?table=4`)
*   **Features**:
    *   **Sticky Top Banner**: Displays the Cafe Name, address, and table number (extracted from the `?table=X` query parameter).
    *   **Search & Filters**: Quick text search and a standard FSSAI **Veg Only** toggle filter.
    *   **Horizontal Categories Selector**: Sliding tabs allowing users to filter by "All", "Hot Drinks", "Snacks", etc.
    *   **Local Cart**: State-tracked items with stepper controls (`−` `qty` `+`).
    *   **Summary Drawer**: Slides up dynamically to show selected items and total cost, linking to checkout.

### Checkout Flow
*   **Route**: `/checkout/:cafeSlug` (e.g. `http://localhost:5173/checkout/chai-corner`)
*   **Features**:
    *   **Prefilled Table Numbers**: If a table parameter was caught from the URL, the input field automatically pre-fills and sets itself to **read-only** so customers cannot modify it.
    *   **Success Screen**: Displays order details, ID, and a corrected FSSAI-style standard confirmation summary.

### Kitchen View (Week 3)
*   **Route**: `/owner/orders` (Requires JWT Authentication)
*   **Features**:
    *   **Live Order Queue**: Lists incoming orders for the logged-in owner's specific cafe, sorted with the newest first.
    *   **Status Management**: Allows changing order states (e.g., from `pending` to `preparing` or `completed`) with instant database persistence.
    *   **Kitchen-Friendly UI**: Organized layout showing table numbers, items, quantities, and elapsed time since the order was placed.

### Owner Management Dashboard (Week 4)
*   **Unified Layout**: Reusable shell (`DashboardLayout.tsx`) with a responsive sidebar. Securely intercepts page loads to verify JWT presence, falling back to a centralized owner login modal.
*   **Menu Item Manager**: `/dashboard/menu`
    *   Clean data grid displaying all menu items, prices, categories, and Veg/Non-Veg indicators.
    *   **Live "Sold-Out" Switch**: Instantly toggles the item's availability in SQLite, instantly hiding/showing the item on the customer menu.
    *   **Add Item Modal**: Add items with name, price, description, category, and veg status.
*   **Category Manager**: `/dashboard/categories`
    *   Displays all categories with name, sort order, active status, and item counts.
    *   **Add & Edit Modals**: Add new categories or update names, sort orders, and active toggles.
    *   **Foreign Key Safety**: Safe deletion interceptor that warns owners if a category has active items (`item_count > 0`), directing them to reassign or delete the items first to prevent SQLite crashes.
*   **QR Generator**: `/owner/qr`
    *   Generates table QR codes dynamically on input.
    *   Direct live target URL preview.
    *   Downloadable QR code PNGs for printing.
