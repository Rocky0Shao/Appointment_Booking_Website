from rest_framework.decorators import api_view
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
            "title": "Booked", 
            "type": "booking" # Use this to color it BLUE on frontend
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
def delete_time_block(request, pk):
    block = get_object_or_404(TimeBlock, pk=pk)
    block.delete()
    return Response({"message": "Deleted successfully"})