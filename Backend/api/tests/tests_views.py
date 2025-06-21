from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from api.models import Category, MenuItem, Cart, CartItem, Order, OrderItem, Table, TableBooking
from django.contrib.auth.models import User, Group
from decimal import Decimal
from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import SimpleUploadedFile
from datetime import date, time
import json


class CategoryViewSetTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.manager_group = Group.objects.create(name="Managers")
        self.user = User.objects.create_user(username="manager", password="pass")
        self.user.groups.add(self.manager_group)
        self.client.login(username="manager", password="pass")
        self.category_data = {"name": "Drinks"}

    def test_create_category(self):
        response = self.client.post(reverse("category-list"), self.category_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Category.objects.count(), 1)
        self.assertEqual(Category.objects.get().name, "Drinks")

    def test_list_categories(self):
        Category.objects.create(name="Drinks")
        response = self.client.get(reverse("category-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)


class MenuItemViewSetTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.manager_group = Group.objects.create(name="Managers")
        self.user = User.objects.create_user(username="manager", password="pass")
        self.user.groups.add(self.manager_group)
        self.client.login(username="manager", password="pass")
        self.category = Category.objects.create(name="Drinks")

        image = Image.new("RGB", (100, 100))
        image_file = BytesIO()
        image.save(image_file, "jpeg")
        image_file.seek(0)
        image = SimpleUploadedFile(
            "test_image.jpg", image_file.read(), content_type="image/jpeg"
        )

        self.menu_item_data = {
            "name": "Coke",
            "price": Decimal("1.99"),
            "category": self.category.id,
            "description": "A refreshing beverage",
            "image": image,
        }

    def test_create_menu_item(self):
        response = self.client.post(reverse("menuitem-list"), self.menu_item_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(MenuItem.objects.count(), 1)
        self.assertEqual(MenuItem.objects.get().name, "Coke")

    def test_list_menu_items(self):
        MenuItem.objects.create(
            name="Coke",
            price=Decimal("1.99"),
            category=self.category,
            description="A refreshing beverage",
        )
        response = self.client.get(reverse("menuitem-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)


class CartViewSetTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="customer", password="pass")
        self.client.login(username="customer", password="pass")
        self.category = Category.objects.create(name="Drinks")
        self.menu_item = MenuItem.objects.create(
            name="Coke", price=Decimal("1.99"), category=self.category
        )

    def test_add_to_cart(self):
        response = self.client.post(
            reverse("cart-list"), {"menuitem": self.menu_item.id, "quantity": 2}
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CartItem.objects.count(), 1)
        self.assertEqual(CartItem.objects.get().quantity, 2)

    def test_list_cart_items(self):
        cart = Cart.objects.create(customer=self.user)
        CartItem.objects.create(cart=cart, menuitem=self.menu_item, quantity=2)
        response = self.client.get(reverse("cart-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["items"]), 1)


class OrderViewSetTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Create user groups
        self.manager_group = Group.objects.create(name="Managers")
        self.crew_group = Group.objects.create(name="Crew")
        
        # Create users
        self.customer = User.objects.create_user(
            username="customer",
            password="testpass123"
        )
        self.manager = User.objects.create_user(
            username="manager",
            password="testpass123"
        )
        self.delivery_crew = User.objects.create_user(
            username="crew",
            password="testpass123"
        )
        
        # Assign groups
        self.manager.groups.add(self.manager_group)
        self.delivery_crew.groups.add(self.crew_group)

        # Create test data
        self.category = Category.objects.create(name="Test Category")
        self.menu_item = MenuItem.objects.create(
            name="Test Item",
            price=Decimal("1.99"),
            category=self.category
        )
        
        # Create table and booking
        self.table = Table.objects.create(
            table_number=1,
            capacity=4
        )
        self.table_booking = TableBooking.objects.create(
            customer=self.customer,
            table=self.table,
            booking_date=date(2024, 3, 20),
            booking_time=time(19, 0),
            number_of_guests=2
        )

    def test_create_dine_in_order_with_booking(self):
        self.client.force_authenticate(user=self.customer)
        
        # Create cart and add items
        cart = Cart.objects.create(customer=self.customer)
        CartItem.objects.create(
            cart=cart,
            menuitem=self.menu_item,
            quantity=1,
            unit_price=self.menu_item.price,
            price=self.menu_item.price
        )
        
        data = {
            'delivery_type': 'dine_in',
            'table_booking': self.table_booking.id
        }
        response = self.client.post(reverse('order-list'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        order = Order.objects.first()
        self.assertEqual(order.delivery_type, 'dine_in')
        self.assertEqual(order.table_booking.id, self.table_booking.id)

    def test_order_with_discount(self):
        self.client.force_authenticate(user=self.customer)
        
        # Create cart and add items
        cart = Cart.objects.create(customer=self.customer)
        CartItem.objects.create(
            cart=cart,
            menuitem=self.menu_item,
            quantity=2,
            unit_price=self.menu_item.price,
            price=self.menu_item.price * 2
        )
        
        data = {
            'delivery_type': 'delivery',
            'discount': 10
        }
        response = self.client.post(reverse('order-list'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        order = Order.objects.first()
        total = Decimal('3.98')  # 1.99 * 2
        expected_subtotal = Decimal('3.58')  # 3.98 - (3.98 * 0.10)
        
        self.assertEqual(order.total, total)
        self.assertEqual(order.subtotal, expected_subtotal)


class TableViewSetTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Create admin user
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass'
        )
        # Create regular user
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass'
        )
        # Create test table
        self.table = Table.objects.create(
            table_number=1,
            capacity=4
        )

    def test_list_tables_authenticated(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(reverse('table-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_create_table_admin_only(self):
        # Test with regular user
        self.client.force_authenticate(user=self.user)
        data = {
            'table_number': 2,
            'capacity': 6
        }
        response = self.client.post(
            reverse('table-list'),
            data,
            format='json'
        )
        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

        # Test with admin user
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            reverse('table-list'),
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Table.objects.count(), 2)

class TableBookingViewSetTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass'
        )
        self.table = Table.objects.create(
            table_number=1,
            capacity=4
        )
        self.valid_booking_data = {
            'table': self.table.id,
            'booking_date': '2024-03-20',
            'booking_time': '19:00',
            'number_of_guests': 2,
            'special_requests': 'Window seat'
        }

    def test_create_booking(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            reverse('table-booking-list'),
            self.valid_booking_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(TableBooking.objects.count(), 1)
        self.assertEqual(
            TableBooking.objects.first().customer,
            self.user
        )

    def test_list_own_bookings(self):
        self.client.force_authenticate(user=self.user)
        # Create a booking
        booking = TableBooking.objects.create(
            customer=self.user,
            table=self.table,
            booking_date=date(2024, 3, 20),
            booking_time=time(19, 0),
            number_of_guests=2
        )
        
        response = self.client.get(reverse('table-booking-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_available_tables_endpoint(self):
        self.client.force_authenticate(user=self.user)
        # Create a booking
        TableBooking.objects.create(
            customer=self.user,
            table=self.table,
            booking_date=date(2024, 3, 20),
            booking_time=time(19, 0),
            number_of_guests=2
        )

        # Check available tables for same time (should be empty)
        response = self.client.get(
            reverse('table-booking-available-tables'),
            {
                'date': '2024-03-20',
                'time': '19:00',
                'guests': 2
            }
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

        # Check available tables for different time (should show table)
        response = self.client.get(
            reverse('table-booking-available-tables'),
            {
                'date': '2024-03-20',
                'time': '20:00',
                'guests': 2
            }
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_booking_validation(self):
        self.client.force_authenticate(user=self.user)
        # Test booking with too many guests
        invalid_data = self.valid_booking_data.copy()
        invalid_data['number_of_guests'] = 6  # Table capacity is 4
        
        response = self.client.post(
            reverse('table-booking-list'),
            invalid_data,
            format='json'
        )
        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    def test_update_booking(self):
        self.client.force_authenticate(user=self.user)
        # Create a booking
        booking = TableBooking.objects.create(
            customer=self.user,
            table=self.table,
            booking_date=date(2024, 3, 20),
            booking_time=time(19, 0),
            number_of_guests=2
        )

        # Update booking
        update_data = {
            'number_of_guests': 3,
            'special_requests': 'Near kitchen'
        }
        response = self.client.patch(
            reverse('table-booking-detail', kwargs={'pk': booking.pk}),
            update_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertEqual(booking.number_of_guests, 3)
        self.assertEqual(booking.special_requests, 'Near kitchen')