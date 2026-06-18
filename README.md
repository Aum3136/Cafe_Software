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
    *   **Prefilled Table Numbers**: If a table parameter was caught from the URL, the input field automatically pre-fills and sets itself to **read-only** so customer cannot modify it.
    *   **Success Screen**: Displays order details, ID, and a corrected FSSAI-style standard confirmation summary.

### Owner Settings
*   **Route**: `/owner/qr` (e.g. `http://localhost:5173/owner/qr`)
*   **Features**:
    *   Generates table QR codes dynamically on input.
    *   Direct live target URL preview.
    *   Downloadable QR code PNGs for printing.
