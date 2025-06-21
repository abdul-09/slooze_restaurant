from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from api.models import MenuItem, Category, Order, Cart, Table, TableBooking, User

class Command(BaseCommand):
    help = 'Creates default groups and permissions'

    def handle(self, *args, **options):
        # Create groups
        managers_group, _ = Group.objects.get_or_create(name='Managers')
        crew_group, _ = Group.objects.get_or_create(name='Crew')
        customers_group, _ = Group.objects.get_or_create(name='Customers')

        # Get content types
        menu_item_ct = ContentType.objects.get_for_model(MenuItem)
        category_ct = ContentType.objects.get_for_model(Category)
        order_ct = ContentType.objects.get_for_model(Order)
        cart_ct = ContentType.objects.get_for_model(Cart)
        table_ct = ContentType.objects.get_for_model(Table)
        table_booking_ct = ContentType.objects.get_for_model(TableBooking)
        user_ct = ContentType.objects.get_for_model(User)

        # Manager Permissions
        manager_permissions = Permission.objects.filter(
            content_type__in=[
                menu_item_ct, category_ct, order_ct, 
                table_ct, table_booking_ct, user_ct
            ],
            codename__in=[
                # Menu management
                'add_menuitem', 'change_menuitem', 'delete_menuitem', 'view_menuitem',
                'add_category', 'change_category', 'delete_category', 'view_category',
                # Order management
                'add_order', 'change_order', 'delete_order', 'view_order',
                # Table management
                'add_table', 'change_table', 'delete_table', 'view_table',
                'add_tablebooking', 'change_tablebooking', 'delete_tablebooking', 'view_tablebooking',
                # User management
                'view_user', 'change_user'
            ]
        )
        managers_group.permissions.set(manager_permissions)
        self.stdout.write(self.style.SUCCESS('Successfully set manager permissions'))

        # Delivery Crew Permissions
        crew_permissions = Permission.objects.filter(
            content_type__in=[order_ct],
            codename__in=[
                'view_order', 'change_order'
            ]
        )
        crew_group.permissions.set(crew_permissions)
        self.stdout.write(self.style.SUCCESS('Successfully set delivery crew permissions'))

        # Customer Permissions
        customer_permissions = Permission.objects.filter(
            content_type__in=[
                menu_item_ct, category_ct, order_ct, 
                cart_ct, table_booking_ct
            ],
            codename__in=[
                # View menu
                'view_menuitem', 'view_category',
                # Order management
                'add_order', 'view_order',
                # Cart management
                'add_cart', 'change_cart', 'delete_cart', 'view_cart',
                # Table booking
                'add_tablebooking', 'view_tablebooking'
            ]
        )
        customers_group.permissions.set(customer_permissions)
        self.stdout.write(self.style.SUCCESS('Successfully set customer permissions'))