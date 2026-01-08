from rest_framework.decorators import api_view, permission_classes
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import HostUser, Booking, TimeBlock


#sends all busy blocks of host to frontend 
# (actually gets all unavailabilities haha)
@api_view(['GET'])
def get_host_availability(request,slug):
    start_date = request.query_params.get('start')
    end_date = request.query_params.get('end')

    if not start_date or not end_date:
        return Response({"error": "Missing start or end date parameters"}, status=400)
    
    host_user = get_object_or_404(HostUser, booking_slug=slug)

    # Logic: Start < RequestEnd AND End > RequestStart
    # Find all overlaps
    bookings = Booking.objects.filter(
        user=host_user,
        start_time__lt=end_date,
        end_time__gt=start_date
    )
    #Find TimeBlocks (Host's blocked times)
    blocks = TimeBlock.objects.filter(
        user=host_user,
        start_time__lt=end_date,
        end_time__gt=start_date
    )

    # Serialization (Convert Python Objects -> JSON List)
    data = []

    # Add Bookings (Blue slots)
    for b in bookings:
        data.append({
            "id": str(b.id),
            "start": b.start_time,
            "end": b.end_time,
            "title": b.guest_name or "Booked", # Show Name as Title!
            "type": "booking",
            "guest_email": b.guest_email,      # <--- NEW
            "guest_name": b.guest_name         # <--- NEW
        })

    # Add Blocks (Red slots)
    for block in blocks:
        data.append({
            "id": str(block.id),
            "start": block.start_time,
            "end": block.end_time,
            "title": "Unavailable",
            "type": "blocked" # Use this to color it RED on frontend
        })

    return Response(data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_time_block(request, pk):
    block = get_object_or_404(TimeBlock, pk=pk)
    block.delete()
    return Response({"message": "Deleted successfully"})



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_time_block(request):
    slug = request.data.get('slug')
    start_time = request.data.get('start')
    end_time = request.data.get('end')

    if start_time >= end_time:
        return Response({"error": "End time must be after start time"}, status=400)
    # 1. Find User
    host = get_object_or_404(HostUser, booking_slug=slug)

    # Before creating the new block, delete any existing blocks 
    # that are FULLY INSIDE the new range.
    TimeBlock.objects.filter(
        user=host,
        start_time__gte=start_time, # Existing start is after new start
        end_time__lte=end_time      # Existing end is before new end
    ).delete()
    
    # 2. Create Block
    # Note: You might want to add overlapping checks here later!
    block = TimeBlock.objects.create(
        user=host,
        start_time=start_time,
        end_time=end_time,
        block_type="blocked"
    )
    
    # 3. Return the new block data so Frontend can render it immediately
    return Response({
        "id": str(block.id),
        "start": block.start_time,
        "end": block.end_time,
        "title": "Unavailable",
        "type": "blocked"
    })


@api_view(['POST'])
def create_booking(request):
    slug = request.data.get('slug')
    start_time = request.data.get('start')
    end_time = request.data.get('end')
    guest_name = request.data.get('name')
    guest_email = request.data.get('email')
    
    host = get_object_or_404(HostUser, booking_slug=slug)

    # 1. DOUBLE CHECK: Is this slot actually free?
    # We must check against BOTH TimeBlocks (Host busy) AND Bookings (Other guests)
    
    # Check TimeBlocks
    busy_blocks = TimeBlock.objects.filter(
        user=host,
        start_time__lt=end_time,
        end_time__gt=start_time
    ).exists()

    # Check Existing Bookings
    busy_bookings = Booking.objects.filter(
        user=host,
        start_time__lt=end_time,
        end_time__gt=start_time
    ).exists()

    if busy_blocks or busy_bookings:
        return Response({"error": "This slot is no longer available."}, status=400)

    # 2. Create the Booking
    booking = Booking.objects.create(
        user=host,
        start_time=start_time,
        end_time=end_time,
        guest_name=guest_name,
        guest_email=guest_email
    )

    # 3. Return success
    return Response({
        "message": "Booking confirmed!",
        "booking": {
            "id": booking.id,
            "start": booking.start_time,
            "end": booking.end_time
        }
    })


class CustomLoginView(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'email': user.email,
            'slug': user.booking_link  # <--- THIS IS THE MAGIC KEY
        })