# serializers.py
from rest_framework import serializers
from .models import Category, User, Restaurant, MenuItem, Cart, CartItem, Order, OrderItem
from django.contrib.auth.hashers import make_password

class UserCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'password', 'first_name', 'last_name', 'region')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)
    
    def validate_region(self, value):
        request = self.context.get('request')
        # Only allow 'global' if the user is admin (for admin panel, not public registration)
        if value == 'global':
            if not request or not request.user.is_authenticated or request.user.role != 'admin':
                raise serializers.ValidationError("Only admins can assign the 'global' region.")
        return value

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role', 'region', 'is_active')

class RestaurantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restaurant
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category # Assuming you create a Category model
        fields = ('id', 'name')

class MenuItemSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True) 

    class Meta:
        model = MenuItem
        # Explicitly list fields for better control
        fields = ('id', 'name', 'description', 'price', 'image_url', 'category', 'is_available', 'restaurant')
        read_only_fields = ('created_at', 'updated_at')

class CartItemSerializer(serializers.ModelSerializer):
    menu_item = MenuItemSerializer(read_only=True)
    menu_item_id = serializers.PrimaryKeyRelatedField(
        queryset=MenuItem.objects.all(),
        source='menu_item',
        write_only=True
    )

    class Meta:
        model = CartItem
        fields = ('id', 'menu_item', 'menu_item_id', 'quantity', 'special_instructions', 'subtotal')
        read_only_fields = ('subtotal',)

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = ('id', 'customer', 'items', 'total', 'created_at', 'updated_at')
        read_only_fields = ('customer', 'total', 'created_at', 'updated_at')

class OrderItemSerializer(serializers.ModelSerializer):
    menu_item = MenuItemSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ('id', 'menu_item', 'quantity', 'price', 'special_instructions', 'subtotal')
        read_only_fields = ('price', 'subtotal')

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    restaurant = RestaurantSerializer(read_only=True)
    restaurant_id = serializers.PrimaryKeyRelatedField(
        queryset=Restaurant.objects.all(),
        source='restaurant',
        write_only=True
    )

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ('customer', 'status', 'total_amount', 'created_at', 'updated_at', 'placed_at', 'cancelled_at')