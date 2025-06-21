# views.py
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import transaction
from .models import User, Restaurant, MenuItem, Cart, CartItem, Order, OrderItem
from .serializers import (
    UserSerializer, RestaurantSerializer, MenuItemSerializer,
    CartSerializer, CartItemSerializer, OrderSerializer, OrderItemSerializer
)
from .permissions import (
    IsAdmin, IsAdminOrReadOnly, IsManager, IsMember, IsAdminOrManager,
    IsSameRegionOrAdmin, CanPlaceOrder, CanCancelOrder, CanUpdatePaymentMethod
)
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.utils.http import urlsafe_base64_encode
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail

from django.db.models import F, Sum, Count, Q
from django.utils.encoding import force_bytes
from .permissions import IsAdmin, IsManager, IsMember
from .models import User, Restaurant, Order
from paypalcheckoutsdk.orders import OrdersGetRequest
from .paypal import PayPalClient

class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    def get(self, request):
        total_users = User.objects.count()
        total_restaurants = Restaurant.objects.count()
        total_orders = Order.objects.count()
        total_revenue = Order.objects.filter(status__in=["confirmed", "preparing", "ready", "delivered"]).aggregate(Sum("total_amount"))["total_amount__sum"] or 0
        recent_orders = list(Order.objects.select_related('restaurant', 'customer').order_by('-created_at')[:5].values(
            'id', 'customer__first_name', 'restaurant__name', 'status', 'created_at', 'total_amount'))
        top_restaurants = list(Restaurant.objects.annotate(order_count=Count('order')).order_by('-order_count')[:3].values('id', 'name', 'order_count'))
        return Response({
            "total_users": total_users,
            "total_restaurants": total_restaurants,
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "recent_orders": recent_orders,
            "top_restaurants": top_restaurants
        })

class ManagerDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsManager]
    def get(self, request):
        region = request.user.region
        total_restaurants = Restaurant.objects.filter(region=region).count()
        total_orders = Order.objects.filter(restaurant__region=region).count()
        total_revenue = Order.objects.filter(restaurant__region=region, status__in=["confirmed", "preparing", "ready", "delivered"]).aggregate(Sum("total_amount"))["total_amount__sum"] or 0
        recent_orders = list(Order.objects.filter(restaurant__region=region).select_related('restaurant', 'customer').order_by('-created_at')[:5].values(
            'id', 'customer__first_name', 'restaurant__name', 'status', 'created_at', 'total_amount'))
        top_restaurants = list(Restaurant.objects.filter(region=region).annotate(order_count=Count('order')).order_by('-order_count')[:3].values('id', 'name', 'order_count'))
        return Response({
            "region": region,
            "total_restaurants": total_restaurants,
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "recent_orders": recent_orders,
            "top_restaurants": top_restaurants
        })

class MemberDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsMember]
    def get(self, request):
        total_orders = Order.objects.filter(customer=request.user).count()
        total_spent = Order.objects.filter(customer=request.user, status__in=["confirmed", "preparing", "ready", "delivered"]).aggregate(Sum("total_amount"))["total_amount__sum"] or 0
        recent_orders = list(Order.objects.filter(customer=request.user).select_related('restaurant').order_by('-created_at')[:5].values(
            'id', 'restaurant__name', 'status', 'created_at', 'total_amount'))
        top_restaurants = list(Restaurant.objects.filter(order__customer=request.user).annotate(order_count=Count('order', filter=Q(order__customer=request.user))).order_by('-order_count').distinct()[:3].values('id', 'name', 'order_count'))
        return Response({
            "total_orders": total_orders,
            "total_spent": total_spent,
            "recent_orders": recent_orders,
            "top_restaurants": top_restaurants
        })

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return User.objects.all()
        elif self.request.user.role == 'manager':
            return User.objects.filter(region=self.request.user.region)
        return User.objects.none()

class RestaurantViewSet(viewsets.ModelViewSet):
    serializer_class = RestaurantSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = Restaurant.objects.filter(is_active=True)
        if self.request.user.role in ['manager', 'member']:
            queryset = queryset.filter(region=self.request.user.region)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class MenuItemViewSet(viewsets.ModelViewSet):
    serializer_class = MenuItemSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        restaurant_id = self.request.query_params.get('restaurant_id')
        queryset = MenuItem.objects.filter(is_available=True)
        
        if restaurant_id:
            queryset = queryset.filter(restaurant_id=restaurant_id)
        
        if self.request.user.role in ['manager', 'member']:
            queryset = queryset.filter(restaurant__region=self.request.user.region)
        
        return queryset

class CartViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated] # All actions require authentication
    serializer_class = CartSerializer

    def get_object(self):
        # Ensure the user has a cart, create one if not
        cart, created = Cart.objects.get_or_create(customer=self.request.user)
        return cart

    @action(detail=False, methods=['get'])
    def current(self, request):
        """Retrieves the current user's cart."""
        cart = self.get_object()
        serializer = self.get_serializer(cart)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        """Adds or updates an item in the cart."""
        cart = self.get_object()
        if int(pk) != cart.id: # Ensure user modifies their own cart
            return Response({"detail": "You can only modify your own cart."}, status=status.HTTP_403_FORBIDDEN)

        menu_item_id = request.data.get('menu_item_id')
        quantity = request.data.get('quantity', 1)
        special_instructions = request.data.get('special_instructions', '')

        if not menu_item_id:
            return Response({"detail": "menu_item_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(quantity, int) or quantity <= 0:
            return Response({"detail": "Quantity must be a positive integer."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            menu_item = MenuItem.objects.get(id=menu_item_id)
        except MenuItem.DoesNotExist:
            return Response({"detail": "Menu item not found."}, status=status.HTTP_404_NOT_FOUND)

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            menu_item=menu_item,
            defaults={'quantity': quantity, 'special_instructions': special_instructions}
        )

        if not created:
            cart_item.quantity = F('quantity') + quantity
            cart_item.special_instructions = special_instructions
            cart_item.save()
            cart_item.refresh_from_db()

        serializer = CartSerializer(cart)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin | IsManager]) # Restrict checkout to Admin/Manager
    def checkout(self, request, pk=None):
        """Proceeds to checkout and creates an order from the cart."""
        cart = self.get_object()
        if int(pk) != cart.id:
            return Response({"detail": "You can only checkout your own cart."}, status=status.HTTP_403_FORBIDDEN)

        if not cart.items.exists():
            return Response({"detail": "Your cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

        payment_method = request.data.get('payment_method')
        special_instructions = request.data.get('special_instructions', '')

        # Use the actual choices from the Order model
        order_payment_choices = [choice[0] for choice in Order.PAYMENT_METHOD_CHOICES]
        if payment_method not in order_payment_choices:
            return Response({"detail": "Invalid payment method."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            first_item_restaurant = cart.items.first().menu_item.restaurant if cart.items.first() else None

            order = Order.objects.create(
                customer=request.user,
                restaurant=first_item_restaurant,
                total_amount=cart.total,
                payment_method=payment_method,
                special_instructions=special_instructions,
                status='pending'
            )

            for cart_item in cart.items.all():
                OrderItem.objects.create(
                    order=order,
                    menu_item=cart_item.menu_item,
                    quantity=cart_item.quantity,
                    price=cart_item.menu_item.price,
                    special_instructions=cart_item.special_instructions
                )
            cart.items.all().delete() # Clear the cart items

        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post']) # Members can remove their own items
    def remove_item(self, request, pk=None):
        """Removes an item from the cart."""
        cart = self.get_object()
        if int(pk) != cart.id:
            return Response({"detail": "You can only modify your own cart."}, status=status.HTTP_403_FORBIDDEN)

        cart_item_id = request.data.get('cart_item_id')

        if not cart_item_id:
            return Response({"detail": "cart_item_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cart_item = CartItem.objects.get(cart=cart, id=cart_item_id)
            cart_item.delete()
            # After deletion, re-serialize the entire cart to send the updated state
            serializer = CartSerializer(cart)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except CartItem.DoesNotExist:
            return Response({"detail": "Cart item not found in your cart."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"detail": f"An error occurred: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post']) # Members can update quantity of their own items
    def update_quantity(self, request, pk=None):
        """Updates the quantity of an item in the cart."""
        cart = self.get_object()
        if int(pk) != cart.id:
            return Response({"detail": "You can only modify your own cart."}, status=status.HTTP_403_FORBIDDEN)

        cart_item_id = request.data.get('cart_item_id')
        new_quantity = request.data.get('quantity')

        if not cart_item_id or new_quantity is None:
            return Response({"detail": "cart_item_id and quantity are required."}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(new_quantity, int) or new_quantity <= 0:
            return Response({"detail": "Quantity must be a positive integer."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cart_item = CartItem.objects.get(cart=cart, id=cart_item_id)
            cart_item.quantity = new_quantity
            cart_item.save()
            serializer = CartSerializer(cart)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except CartItem.DoesNotExist:
            return Response({"detail": "Cart item not found in your cart."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"detail": f"An error occurred: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated] # Base permission for all order actions

    def get_queryset(self):
        # Admins/Managers can see all orders. Members can only see their own.
        if self.request.user.is_authenticated and not (self.request.user.is_staff or self.request.user.role in ['admin', 'manager']):
            return self.queryset.filter(customer=self.request.user)
        return self.queryset

    def create(self, request, *args, **kwargs):
        # Orders are created via cart checkout, not directly via POST to /orders/
        return Response({"detail": "Orders are created via cart checkout."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def update(self, request, *args, **kwargs):
        if self.request.user.role not in ['admin', 'manager']:
            return Response({"detail": "Only admins/managers can directly update orders."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if self.request.user.role not in ['admin', 'manager']:
            return Response({"detail": "Only admins/managers can directly update orders."}, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        # Only admins should be able to delete orders
        if self.request.user.role != 'admin':
            return Response({"detail": "Only admins can delete orders."}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin | IsManager]) # Only Admin/Manager can update status
    def update_status(self, request, pk=None):
        """Admin/Manager action to update order status."""
        order = get_object_or_404(Order, pk=pk)
        new_status = request.data.get('status')
        if new_status and new_status in dict(order.STATUS_CHOICES):
            order.status = new_status
            order.save()
            serializer = self.get_serializer(order)
            return Response(serializer.data)
        return Response({"detail": "Invalid status or status not provided."}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin | IsManager]) # Only Admin/Manager can cancel orders
    def cancel(self, request, pk=None):
        """Admin/Manager action to cancel an order."""
        order = get_object_or_404(Order, pk=pk)
        if order.status in ['pending', 'processing']:
            order.status = 'cancelled'
            order.cancelled_at = timezone.now() # Add cancelled_at timestamp
            order.save()
            serializer = self.get_serializer(order)
            return Response(serializer.data)
        return Response({"detail": "Order cannot be cancelled at this stage."}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin]) # Only Admin can update payment method
    def update_payment(self, request, pk=None):
        """Admin action to update order payment method."""
        order = get_object_or_404(Order, pk=pk)
        new_payment_method = request.data.get('payment_method')
        order_payment_choices = [choice[0] for choice in Order.PAYMENT_METHOD_CHOICES]

        if new_payment_method and new_payment_method in order_payment_choices:
            order.payment_method = new_payment_method
            order.save()
            serializer = self.get_serializer(order)
            return Response(serializer.data)
        return Response({"detail": "Invalid payment method or payment method not provided."}, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User with this email does not exist.'}, status=status.HTTP_400_BAD_REQUEST)

        token_generator = PasswordResetTokenGenerator()
        token = token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        reset_link = f"https://slooze-restaurant.vercel.app/reset-password/{uid}/{token}"
        send_mail(
            'Password Reset',
            f'Click the link to reset your password: {reset_link}',
            'no-reply@yourdomain.com',
            [email],
            fail_silently=False,
        )


        return Response({'message': 'Password reset link sent.'}, status=status.HTTP_200_OK)
    
class PasswordResetConfirmView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        re_new_password = request.data.get('re_new_password')

        print("Received UID:", uid)
        print("Received Token:", token)
        print("New Password:", new_password)
        print("Re-New Password:", re_new_password)

        if not all([uid, token, new_password, re_new_password]):
            return Response({'error': 'All fields are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            u_id = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(pk=u_id)
        except User.DoesNotExist:
            return Response({'error': 'Invalid user ID.'}, status=status.HTTP_400_BAD_REQUEST)

        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(user, token):
            return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        
        return Response({'message': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def paypal_payment_complete(request):
    PPClient = PayPalClient()
    order_id = request.data.get("orderID")
    if not order_id:
        return Response({"detail": "orderID is required"}, status=status.HTTP_400_BAD_REQUEST)

    # Get PayPal order details
    paypal_request = OrdersGetRequest(order_id)
    paypal_response = PPClient.client.execute(paypal_request)
    result = paypal_response.result

    total_paid = result.purchase_units[0].amount.value
    payer_email = result.payer.email_address
    shipping = result.purchase_units[0].shipping

    # Get user's cart
    cart, _ = Cart.objects.get_or_create(customer=request.user)
    if not cart.items.exists():
        return Response({"detail": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST)

    # Create order
    with transaction.atomic():
        first_item_restaurant = cart.items.first().menu_item.restaurant
        order = Order.objects.create(
            customer=request.user,
            restaurant=first_item_restaurant,
            total_amount=total_paid,
            payment_method="paypal",
            special_instructions="",
            status='confirmed'
        )
        for cart_item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                menu_item=cart_item.menu_item,
                quantity=cart_item.quantity,
                price=cart_item.menu_item.price,
                special_instructions=cart_item.special_instructions
            )
        cart.items.all().delete()

    return Response({"message": "Payment completed!", "order_id": order.id}, status=status.HTTP_201_CREATED)