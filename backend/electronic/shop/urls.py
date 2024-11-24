from django.urls import path
from . import views

urlpatterns = [
    path('products/', views.home, name='home'),
    path('product/', views.product_detail, name='product_detail'),
    path('seller/products/', views.seller_products, name='seller_products'),
    path('seller/add/', views.add_product, name='add_product'),
    path('seller/delete/', views.delete_product, name='delete_product'),
    path('order/', views.place_order, name='place_order'),
    path('orders/', views.order_history, name='order_history'),
    path('register/', views.register, name='register'),
    path('user/', views.get_user_info, name='get_user_info'),
    path('login/', views.login_user, name='login'),
    path('seller/edit/', views.edit_product, name='edit_product'),
    path('seller/orders/', views.seller_orders, name='seller_order'),

]
