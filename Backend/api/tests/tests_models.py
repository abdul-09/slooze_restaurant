from django.test import TestCase
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from api.models import Category, MenuItem, Cart, CartItem, Order, OrderItem, Table, TableBooking
from decimal import Decimal
from datetime import date, time


class CategoryModelTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Drinks")

    def test_create_category(self):
        self.assertEqual(self.category.name, "Drinks")
        self.assertEqual(self.category.slug, "drinks")
        self.assertTrue(isinstance(self.category, Category))
        self.assertEqual(str(self.category), self.category.name)


class MenuItemModelTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Drinks")
        self.menu_item = MenuItem.objects.create(
            name="Coke",
            price=Decimal("1.99"),
            category=self.category,
            description="A refreshing beverage",
        )

    def test_create_menu_item(self):
        self.assertEqual(self.menu_item.name, "Coke")
        self.assertEqual(self.menu_item.slug, "coke")
        self.assertEqual(self.menu_item.price, Decimal("1.99"))
        self.assertEqual(self.menu_item.category, self.category)
        self.assertTrue(isinstance(self.menu_item, MenuItem))
        self.assertEqual(str(self.menu_item), self.menu_item.name)


class CartItemModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="testpass")
        self.cart = Cart.objects.create(customer=self.user)
        self.category = Category.objects.create(name="Drinks")
        self.menu_item = MenuItem.objects.create(
            name="Coke", price=Decimal("1.99"), category=self.category
        )
        self.cart_item = CartItem.objects.create(
            cart=self.cart, menuitem=self.menu_item, quantity=2
        )

    def test_create_cart_item(self):
        self.assertEqual(self.cart_item.cart, self.cart)
        self.assertEqual(self.cart_item.menuitem, self.menu_item)
        self.assertEqual(self.cart_item.quantity, 2)
        self.assertTrue(isinstance(self.cart_item, CartItem))
        self.assertEqual(str(self.cart_item), f"{self.menu_item.name} ({self.cart_item.quantity})")


class OrderModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="testpass")
        self.order = Order.objects.create(customer=self.user)
        self.table = Table.objects.create(table_number=1, capacity=4)
        self.table_booking = TableBooking.objects.create(
            customer=self.user,
            table=self.table,
            booking_date=date(2024, 3, 20),
            booking_time=time(19, 0),
            number_of_guests=2
        )
        self.category = Category.objects.create(name="Drinks")
        self.menu_item = MenuItem.objects.create(
            name="Coke",
            price=Decimal("1.99"),
            category=self.category
        )

    def test_create_order(self):
        self.assertEqual(self.order.customer, self.user)
        self.assertEqual(self.order.status, "pending")
        self.assertTrue(isinstance(self.order, Order))
        self.assertEqual(str(self.order), f"Order {self.order.id}")

    def test_create_order_with_delivery_type(self):
        # Test different delivery types
        order_pickup = Order.objects.create(
            customer=self.user,
            delivery_type='pickup'
        )
        self.assertEqual(order_pickup.delivery_type, 'pickup')

        order_dine_in = Order.objects.create(
            customer=self.user,
            delivery_type='dine_in',
            table_booking=self.table_booking
        )
        self.assertEqual(order_dine_in.delivery_type, 'dine_in')
        self.assertEqual(order_dine_in.table_booking, self.table_booking)

        order_delivery = Order.objects.create(
            customer=self.user,
            delivery_type='delivery'
        )
        self.assertEqual(order_delivery.delivery_type, 'delivery')

    def test_order_with_table_booking(self):
        order = Order.objects.create(
            customer=self.user,
            delivery_type='dine_in',
            table_booking=self.table_booking
        )
        self.assertEqual(order.table_booking.table.table_number, 1)
        self.assertEqual(order.table_booking.number_of_guests, 2)


class OrderItemModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create(username="testuser", password="testpass")
        self.order = Order.objects.create(customer=self.user)
        self.category = Category.objects.create(name="Drinks")
        self.menu_item = MenuItem.objects.create(
            name="Coke", price=Decimal("1.99"), category=self.category
        )
        self.order_item = OrderItem.objects.create(
            order=self.order, menuitem=self.menu_item, quantity=2
        )

    def test_create_order_item(self):
        self.assertEqual(self.order_item.order, self.order)
        self.assertEqual(self.order_item.menuitem, self.menu_item)
        self.assertEqual(self.order_item.quantity, 2)
        self.assertEqual(self.order_item.price, self.menu_item.price)
        self.assertTrue(isinstance(self.order_item, OrderItem))
        self.assertEqual(str(self.order_item), str(self.order_item.id))
        self.assertEqual(self.order_item.total_cost, self.order_item.price * 2)

class TableModelTest(TestCase):
    def setUp(self):
        self.table = Table.objects.create(
            table_number=1,
            capacity=4,
            is_active=True
        )

    def test_create_table(self):
        self.assertEqual(self.table.table_number, 1)
        self.assertEqual(self.table.capacity, 4)
        self.assertTrue(self.table.is_active)
        self.assertTrue(isinstance(self.table, Table))
        self.assertEqual(str(self.table), "Table 1 (Seats 4)")

class TableBookingModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            password="testpass"
        )
        self.table = Table.objects.create(
            table_number=1,
            capacity=4
        )
        self.booking = TableBooking.objects.create(
            customer=self.user,
            table=self.table,
            booking_date=date(2024, 3, 20),
            booking_time=time(19, 0),
            number_of_guests=2,
            special_requests="Window seat"
        )

    def test_create_booking(self):
        self.assertEqual(self.booking.customer, self.user)
        self.assertEqual(self.booking.table, self.table)
        self.assertEqual(self.booking.number_of_guests, 2)
        self.assertEqual(self.booking.status, 'pending')
        self.assertEqual(
            str(self.booking),
            f"Booking for testuser - Table 1"
        )

    def test_booking_exceeds_capacity(self):
        # Fix: Use clean() method to trigger validation
        booking = TableBooking(
            customer=self.user,
            table=self.table,
            booking_date=date(2024, 3, 21),
            booking_time=time(19, 0),
            number_of_guests=6  # Table capacity is 4
        )
        with self.assertRaises(ValidationError):
            booking.clean()

    def test_double_booking_prevention(self):
        # Attempt to create a booking for the same table, date and time
        with self.assertRaises(Exception):  # Could be IntegrityError
            TableBooking.objects.create(
                customer=self.user,
                table=self.table,
                booking_date=date(2024, 3, 20),
                booking_time=time(19, 0),
                number_of_guests=2
            )