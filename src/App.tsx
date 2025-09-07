import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import Categories from "./pages/Categories";
import ProductDetail from "./pages/ProductDetail";
import Catalog from "./pages/Catalog";
import Preorders from "./pages/Preorders";
import Bundles from "./pages/Bundles";
import Deals from "./pages/Deals";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import MyOrders from "./pages/MyOrders";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Favorites from "./pages/Favorites";
import Dashboard from "./pages/admin/Dashboard";
import ProductsAdmin from "./pages/admin/Products";
import CategoriesAdmin from "./pages/admin/Categories";
import PlatformsAdmin from "./pages/admin/Platforms";
import PromotionsAdmin from "./pages/admin/Promotions";
import PaymentMethodsAdmin from "./pages/admin/PaymentMethods";
import OrdersAdmin from "./pages/admin/Orders";
import UsersAdmin from "./pages/admin/Users";
import SettingsAdmin from "./pages/admin/Settings";
import BusinessHoursAdmin from "./pages/admin/BusinessHours";
import ReviewsAdmin from "./pages/admin/Reviews";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <CartProvider>
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/my-orders" element={<MyOrders />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmation />} />
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/products" element={<ProductsAdmin />} />
              <Route path="/admin/categories" element={<CategoriesAdmin />} />
              <Route path="/admin/platforms" element={<PlatformsAdmin />} />
              <Route path="/admin/promotions" element={<PromotionsAdmin />} />
              <Route path="/admin/payment-methods" element={<PaymentMethodsAdmin />} />
              <Route path="/admin/orders" element={<OrdersAdmin />} />
              {/* Removed route for admin "Mis Pedidos" */}
              <Route path="/admin/users" element={<UsersAdmin />} />
              <Route path="/admin/business-hours" element={<BusinessHoursAdmin />} />
              <Route path="/admin/settings" element={<SettingsAdmin />} />
              <Route path="/admin/reviews" element={<ReviewsAdmin />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/pre-orders" element={<Preorders />} />
              <Route path="/packs" element={<Bundles />} />
              <Route path="/deals" element={<Deals />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </CartProvider>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
