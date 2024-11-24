import os
import json
import tempfile
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.contrib.auth import get_user_model, authenticate
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.http import JsonResponse
from .models import Product
from .aws import send_seller_notification, upload_to_s3, delete_from_s3, subscribe_seller_to_sns
from .models import Product, Order

User = get_user_model()

# Register API
@csrf_exempt
def register(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data['username']
            password = data['password']
            email = data.get('email', '')
            is_seller = data.get('is_seller', False)  # Default to False if not provided
            is_buyer = data.get('is_buyer', False)    # Default to False if not provided

            # Check if user already exists
            if User.objects.filter(username=username).exists():
                return JsonResponse({'error': 'Username already taken'}, status=400)

            # Validate at least one role is selected
            if not (is_seller or is_buyer):
                return JsonResponse({'error': 'User must be either a buyer or a seller.'}, status=400)

            # Create the user with roles
            user = User.objects.create_user(
                username=username,
                password=password,
                email=email,
                is_seller=is_seller,
                is_buyer=is_buyer,
            )
            user.save()

            # Subscribe to SNS topic if user is a seller
            if is_seller:
                subscribe_seller_to_sns(email)

            return JsonResponse({'message': 'User registered successfully'}, status=201)
        except KeyError as e:
            return JsonResponse({'error': f'Missing field: {str(e)}'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Invalid method'}, status=405)


# Login API with JWT Token Generation
@csrf_exempt
def login_user(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')

            user = authenticate(username=username, password=password)
            if user is not None:
                # Generate JWT tokens
                refresh = RefreshToken.for_user(user)
                return JsonResponse({
                    'message': 'Login successful',
                    'username': user.username,
                    'is_seller': user.is_seller,
                    'is_buyer': user.is_buyer,
                    'access_token': str(refresh.access_token),
                    'refresh_token': str(refresh),
                }, status=200)
            else:
                return JsonResponse({'error': 'Invalid username or password'}, status=401)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Invalid method'}, status=405)

# Get User Info (Protected)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    user = request.user
    return JsonResponse({
        'username': user.username,
        'is_seller': user.is_seller,
        'is_buyer': user.is_buyer,
    })

# Home Page (Product List)
@api_view(['GET'])
def home(request):
    products = Product.objects.all()
    product_list = [
        {
            'id': product.id,
            'name': product.name,
            'description': product.description,
            'price': product.price,
            'stock': product.stock,
            'image_url': product.image_url,
            'seller_id': product.seller.id,
        } for product in products
    ]
    return JsonResponse({'products': product_list})

# Product Detail API
@api_view(['GET'])
def product_detail(request):
    print(request)
    product_id = request.product_id
    product = get_object_or_404(Product, id=product_id)
    product_data = {
        'id': product.id,
        'name': product.name,
        'description': product.description,
        'price': product.price,
        'stock': product.stock,
        'image_url': product.image_url,
        'seller_id': product.seller.id,
    }
    return JsonResponse({'product': product_data})

# Seller Product Management
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def seller_products(request):
    if not request.user.is_seller:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    products = Product.objects.filter(seller=request.user)
    product_list = [
        {
            'id': product.id,
            'name': product.name,
            'description': product.description,
            'price': product.price,
            'stock': product.stock,
            'image_url': product.image_url,
        } for product in products
    ]
    return JsonResponse({'products': product_list})

# Add Product API (Protected)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_product(request):
    if request.method == "POST":
        try:
            name = request.POST.get("name")
            description = request.POST.get("description")
            price = request.POST.get("price")
            stock = request.POST.get("stock")
            image = request.FILES.get("image")

            if not image:
                return JsonResponse({"error": "No image file provided"}, status=400)

            # Use a temporary file
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                temp_file.write(image.read())
                temp_path = temp_file.name

            # Define object name and upload to S3
            object_name = f"media/products/{image.name}"
            file_url = upload_to_s3(temp_path, object_name)

            # Clean up temporary file
            os.remove(temp_path)

            if file_url:
                # Save product to the database
                product = Product.objects.create(
                    name=name,
                    description=description,
                    price=price,
                    stock=stock,
                    image_url=file_url,
                    seller=request.user,
                )
                return JsonResponse({"message": "Product added successfully", "product_id": product.id})
            else:
                return JsonResponse({"error": "Failed to upload image"}, status=500)

        except KeyError as e:
            return JsonResponse({'error': f"Missing field: {str(e)}"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request"}, status=400)


# Delete Product API (Protected)
@csrf_exempt  # Use if CSRF token is not handled in your frontend
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_product(request):
    try:
        data = json.loads(request.body)
        product_id = data.get('product_id')

        product = Product.objects.get(id=product_id, seller=request.user)

        # Delete the image from S3
        if product.image_url:
            object_name = product.image_url.split("/")[-1]  # Extract the S3 key
            delete_from_s3(f"media/products/{object_name}")

        product.delete()
        return JsonResponse({'message': 'Product deleted successfully'}, status=200)
    except Product.DoesNotExist:
        return JsonResponse({'error': 'Product not found or unauthorized'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def edit_product(request):
    try:
        # Extract product_id and validate the seller
        print(request.data)
        product_id = request.data.get('product_id')
        product = Product.objects.get(id=product_id, seller=request.user)

        # Update product details
        product.name = request.data.get('name', product.name)
        product.description = request.data.get('description', product.description)
        product.price = request.data.get('price', product.price)
        product.stock = request.data.get('stock', product.stock)

        # Handle image update if provided
        if 'image' in request.FILES:
            image = request.FILES['image']

            # Save the file temporarily
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                temp_file.write(image.read())
                temp_path = temp_file.name

            # Define object name and upload to S3
            object_name = f"media/products/{image.name}"
            file_url = upload_to_s3(temp_path, object_name)

            # Clean up temporary file
            os.remove(temp_path)

            if file_url:
                # Update the product's image URL
                product.image_url = file_url
            else:
                return JsonResponse({"error": "Failed to upload image"}, status=500)

        product.save()
        return JsonResponse({'message': 'Product updated successfully'}, status=200)
    except Product.DoesNotExist:
        return JsonResponse({'error': 'Product not found or unauthorized'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# Place Order API (Protected)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def place_order(request):
    # Ensure the user is a buyer
    if not request.user.is_buyer:
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    try:
        # Extract product_id and other data from the request body
        data = request.data
        product_id = data.get('product_id')  # Extract product_id correctly
        quantity = int(data.get('quantity'))
        address = data.get('address')

        # Validate product existence
        product = get_object_or_404(Product, id=product_id)

        # Calculate total price and create order
        total_price = product.price * quantity
        order = Order.objects.create(
            buyer=request.user,
            product=product,
            quantity=quantity,
            address=address,
            total_price=total_price,
        )

        # Reduce product stock and save
        product.stock -= quantity
        product.save()

        message_body = {
            "order_id": order.id,
            "product_name": product.name,
            "quantity": quantity,
            "total_price": total_price,
            "seller_id": product.seller.id,
            "buyer_username": request.user.username,
            "seller_email": product.seller.email
        }

        send_seller_notification(message_body)
        # Prepare response data
        order_data = {
            'id': order.id,
            'product': {
                'id': product.id,
                'name': product.name,
            },
            'quantity': order.quantity,
            'total_price': order.total_price,
            'address': order.address,
        }
        return JsonResponse({'order': order_data}, status=201)

    except KeyError as e:
        return JsonResponse({'error': f'Missing field: {str(e)}'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# View Order History API (Protected)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_history(request):
    if not request.user.is_buyer:
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    orders = Order.objects.filter(buyer=request.user).select_related('product')
    order_list = [
        {
            'id': order.id,
            'product': {
                'id': order.product.id,
                'name': order.product.name,
            },
            'quantity': order.quantity,
            'total_price': order.total_price,
            'address': order.address,
            'created_at': order.created_at,
        }
        for order in orders
    ]
    return JsonResponse(order_list, safe=False)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def seller_orders(request):
    if not request.user.is_seller:
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    # Get products belonging to the logged-in seller
    seller_products = Product.objects.filter(seller=request.user)

    # Get orders for those products
    orders = Order.objects.filter(product__in=seller_products).select_related('product', 'buyer')

    # Serialize the data
    order_list = [
        {
            'id': order.id,
            'product': {
                'id': order.product.id,
                'name': order.product.name,
            },
            'buyer': {
                'id': order.buyer.id,
                'username': order.buyer.username,
            },
            'quantity': order.quantity,
            'total_price': order.total_price,
            'address': order.address,
            'created_at': order.created_at,
        }
        for order in orders
    ]
    return JsonResponse({'orders': order_list}, safe=False)
