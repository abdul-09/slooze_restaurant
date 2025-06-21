from django.urls import path, re_path, include
from django.views.generic import TemplateView
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, RestaurantViewSet, MenuItemViewSet,
    CartViewSet, OrderViewSet, PasswordResetConfirmView, PasswordResetView,
    paypal_payment_complete,
    AdminDashboardView, ManagerDashboardView, MemberDashboardView
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'restaurants', RestaurantViewSet, basename='restaurant')
router.register(r'menu-items', MenuItemViewSet, basename='menuitem')
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'orders', OrderViewSet, basename='order')

urlpatterns = [
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.jwt')),
    path('dashboard/admin/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('dashboard/manager/', ManagerDashboardView.as_view(), name='manager-dashboard'),
    path('dashboard/member/', MemberDashboardView.as_view(), name='member-dashboard'),
    path('', include(router.urls)),
    # path('payments/verify/<int:order_id>/', verify_payment, name='verify-payment'),
    path('payments/paypal/complete/', paypal_payment_complete, name='paypal-payment-complete'),
    path('auth/password/reset/', PasswordResetView.as_view(), name='password-reset'),
    path('auth/password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    # Catch-all route for React
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]

# urlpatterns += staticfiles_urlpatterns