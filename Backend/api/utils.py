from django.db import transaction
import uuid
from django.utils import timezone
from datetime import datetime


def generate_unique_order_reference():
    """Generate a unique order reference combining timestamp and UUID"""
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    unique_id = str(uuid.uuid4().hex)[:8]

    res = f"ORD-{timestamp}-{unique_id}"
    print(res)
    return res