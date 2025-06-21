# permissions.py
from rest_framework import permissions

from api.models import User


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    The request is authenticated as a user, and is an admin for unsafe methods.
    All authenticated users can read.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_authenticated and request.user.role == 'admin'

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"

class IsManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "manager"

class IsMember(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "member"

class IsAdminOrManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ["admin", "manager"]

class IsSameRegionOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # For models with region field
        if hasattr(obj, 'region'):
            return (
                request.user.role == "admin" or 
                (request.user.role == "manager" and obj.region == request.user.region)
            )
        # For user objects
        elif isinstance(obj, User):
            return (
                request.user.role == "admin" or 
                (request.user.role == "manager" and obj.region == request.user.region)
            )
        return False

class CanPlaceOrder(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ["admin", "manager"]

class CanCancelOrder(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ["admin", "manager"]

class CanUpdatePaymentMethod(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"