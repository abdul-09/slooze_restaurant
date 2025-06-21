import os
import django
from django.core.management import call_command

# Set the DJANGO_SETTINGS_MODULE to your settings file
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "restaurant.settings")

# Setup Django
django.setup()

# Now run the command
with open("data.json", "w", encoding="utf-8") as f:
    call_command("dumpdata", exclude=["auth.permission", "contenttypes"], indent=2, stdout=f)
