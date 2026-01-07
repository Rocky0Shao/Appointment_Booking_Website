from django.contrib import admin
from django.urls import path
from api.views import get_host_availability, delete_time_block, create_time_block, create_booking
urlpatterns = [
    path('admin/', admin.site.urls),
    
    # We added <slug:slug> to capture the username from the URL
    path('api/availability/<slug:slug>/', get_host_availability, name="get_host_availability"),
    path('api/time-blocks/<uuid:pk>/', delete_time_block, name="delete_time_block"),
    path('api/time-blocks/create/', create_time_block, name="create_time_block"),
    path('api/bookings/create/', create_booking, name="create_booking"),
]