from django.contrib import admin
from .models import User, Product, Order

# Register User model
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'is_seller', 'is_buyer', 'is_staff')
    list_filter = ('is_seller', 'is_buyer', 'is_staff')
    search_fields = ('username', 'email')

# Register Product model
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'seller', 'price', 'stock')
    list_filter = ('seller',)
    search_fields = ('name', 'seller__username')

    def save_model(self, request, obj, form, change):
        # Debug the uploaded file
        if 'image' in request.FILES:
            print(f"Uploaded image: {request.FILES['image']}")
        else:
            print("No image uploaded")

        # Call the default save method
        super().save_model(request, obj, form, change)

        # Confirm the image path
        # Debugging S3 Path
        if obj.image:
            print(f"Image path: {obj.image.url}")


# Register Order model
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'buyer', 'product', 'quantity', 'total_price', 'created_at')
    list_filter = ('buyer', 'product', 'created_at')
    search_fields = ('buyer__username', 'product__name')
