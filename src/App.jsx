import { Route, Routes } from 'react-router-dom'
import AdminLayout from './admin/AdminLayout'
import AdminLoginPage from './admin/AdminLoginPage'
import CategoriesPage from './admin/CategoriesPage'
import DashboardPage from './admin/DashboardPage'
import MenusPage from './admin/MenusPage'
import OrdersPage from './admin/OrdersPage'
import RequireAdmin from './admin/RequireAdmin'
import TablesPage from './admin/TablesPage'
import ScrollToTop from './components/ScrollToTop'
import CheckoutPage from './pages/CheckoutPage'
import LandingPage from './pages/LandingPage'
import NotFoundPage from './pages/NotFoundPage'
import OrderStatusPage from './pages/OrderStatusPage'
import ScanPage from './pages/ScanPage'
import TableMenuPage from './pages/TableMenuPage'

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/t/:token" element={<TableMenuPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order/:orderNumber" element={<OrderStatusPage />} />

        <Route path="/admin/login" element={<AdminLoginPage />} />

        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="menus" element={<MenusPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="tables" element={<TablesPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}
