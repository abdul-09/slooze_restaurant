from django.contrib import admin
from .models import Cart, CartItem, Category, Order, User, Restaurant, MenuItem

admin.site.register(User)
admin.site.register(Restaurant)
admin.site.register(MenuItem)
admin.site.register(Category)
admin.site.register(CartItem)
admin.site.register(Cart)
admin.site.register(Order)
