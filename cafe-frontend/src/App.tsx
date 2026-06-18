import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { CustomerMenu } from './pages/CustomerMenu';
import { CheckoutPage } from './pages/CheckoutPage';
import { QrGenerator } from './pages/QrGenerator';
import { OwnerOrders } from './pages/OwnerOrders';
import { MenuManager } from './pages/MenuManager';
import { CategoryManager } from './pages/CategoryManager';
import { Reports } from './pages/Reports';
import { DashboardLayout } from './components/DashboardLayout';

/*
  Route map (Week 2):
    /menu/:cafeSlug  → customer menu (public)
    /                → redirect to a demo cafe for development convenience
    *                → 404 fallback

  Week 3 will add:
    /checkout/:cafeSlug  → order placement
  
  Week 4 will add:
    /dashboard           → owner login + management (separate auth flow)
*/

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <div className="text-5xl mb-4">🔍</div>
      <h1 className="text-lg font-semibold text-ink mb-2">Page not found</h1>
      <p className="text-sm text-muted">This link doesn't seem to exist.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          {/* Public customer menu — no auth */}
          <Route path="/menu/:cafeSlug" element={<CustomerMenu />} />

          {/* Checkout page */}
          <Route path="/checkout/:cafeSlug" element={<CheckoutPage />} />

          {/* Owner QR Code Generator */}
          <Route path="/owner/qr" element={<DashboardLayout><QrGenerator /></DashboardLayout>} />

          {/* Owner Orders Kitchen Queue */}
          <Route path="/owner/orders" element={<DashboardLayout><OwnerOrders /></DashboardLayout>} />

          {/* Owner Menu Item Manager */}
          <Route path="/dashboard/menu" element={<DashboardLayout><MenuManager /></DashboardLayout>} />

          {/* Owner Category Manager */}
          <Route path="/dashboard/categories" element={<DashboardLayout><CategoryManager /></DashboardLayout>} />

          {/* Owner Reports & Sales Analytics */}
          <Route path="/dashboard/reports" element={<DashboardLayout><Reports /></DashboardLayout>} />

          {/* Dev convenience: visiting / shows the seeded test cafe */}
          <Route path="/" element={<Navigate to="/menu/chai-corner" replace />} />

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}
