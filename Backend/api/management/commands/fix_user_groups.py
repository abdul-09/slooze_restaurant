from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

User = get_user_model()

class Command(BaseCommand):
    help = 'Fix user groups for existing users'

    def handle(self, *args, **options):
        # Create default groups
        managers_group, _ = Group.objects.get_or_create(name='Managers')
        crew_group, _ = Group.objects.get_or_create(name='Crew')
        customers_group, _ = Group.objects.get_or_create(name='Customers')

        # Get all users without any group
        users_without_group = User.objects.filter(groups__isnull=True)
        
        # Add them to Customers group by default
        for user in users_without_group:
            if not user.is_superuser:
                customers_group.user_set.add(user)
                self.stdout.write(
                    self.style.SUCCESS(f'Added user {user.email} to Customers group')
                )

        self.stdout.write(self.style.SUCCESS('Successfully fixed user groups')) 