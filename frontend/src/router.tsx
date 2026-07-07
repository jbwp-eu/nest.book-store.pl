import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminRoute from "@/components/auth/AdminRoute";
import RootLayout from "@/pages/RootLayout";
import HomePage from "@/pages/HomePage";
import CartPage from "@/pages/CartPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import ContactPage from "@/pages/ContactPage";
import TermsPage from "@/pages/TermsPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ProfilePage from "@/pages/ProfilePage";
import ShippingPage from "@/pages/ShippingPage";
import PaymentPage from "@/pages/PaymentPage";
import CheckoutPage from "@/pages/CheckoutPage";
import OrderPage from "@/pages/OrderPage";
import MyOrdersPage from "@/pages/MyOrdersPage";
import MyReviewsPage from "@/pages/MyReviewsPage";
import AdminLayout from "@/pages/admin/AdminLayout";
import OverviewPage from "@/pages/admin/OverviewPage";
import AdminOrdersPage from "@/pages/admin/AdminOrdersPage";
import AdminProductsPage from "@/pages/admin/AdminProductsPage";
import AdminProductEditPage from "@/pages/admin/AdminProductEditPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminUserEditPage from "@/pages/admin/AdminUserEditPage";
import AdminReviewsPage from "@/pages/admin/AdminReviewsPage";
import StripePaymentSuccessPage from "@/pages/StripePaymentSuccessPage";
import ErrorPage from "@/pages/ErrorPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "page/:pageNumber", element: <HomePage /> },
      { path: "product/:id", element: <ProductDetailPage /> },
      { path: "cart", element: <CartPage /> },
      { path: "contact", element: <ContactPage /> },
      { path: "terms", element: <TermsPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: "profile", element: <ProfilePage /> },
          { path: "my-orders", element: <MyOrdersPage /> },
          { path: "my-reviews", element: <MyReviewsPage /> },
          { path: "shipping", element: <ShippingPage /> },
          { path: "payment", element: <PaymentPage /> },
          { path: "checkout", element: <CheckoutPage /> },
          { path: "order/:id", element: <OrderPage /> },
          {
            path: "order/:id/payment-success",
            element: <StripePaymentSuccessPage />,
          },
        ],
      },
      {
        element: <AdminRoute />,
        children: [
          {
            path: "admin",
            element: <AdminLayout />,
            children: [
              { index: true, element: <Navigate to="overview" replace /> },
              { path: "overview", element: <OverviewPage /> },
              { path: "orders", element: <AdminOrdersPage /> },
              { path: "orders/page/:pageNumber", element: <AdminOrdersPage /> },
              { path: "products", element: <AdminProductsPage /> },
              { path: "products/:id/edit", element: <AdminProductEditPage /> },
              { path: "products/page/:pageNumber", element: <AdminProductsPage /> },
              { path: "users", element: <AdminUsersPage /> },
              { path: "users/:id/edit", element: <AdminUserEditPage /> },
              { path: "reviews", element: <AdminReviewsPage /> },
              { path: "reviews/page/:pageNumber", element: <AdminReviewsPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
