from django.db import models

class Booking(models.Model):
    # 1. GUEST INFO (No Account Needed)
    # We store their details directly on this appointment.
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True, null=True)

    # 2. APPOINTMENT DETAILS
    # Use DateTimeField so you get the Day AND the Hour (e.g., 2023-10-15 14:30)
    start_time = models.DateTimeField()
    
    # Duration in minutes (e.g., 30, 60). Easier to do math with integers.
    duration_minutes = models.IntegerField(default=30)

    # 3. STATUS (The Logic)
    # This prevents double bookings effectively.
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('CANCELLED', 'Cancelled'),
    ]
    status = models.CharField(
        max_length=10, 
        choices=STATUS_CHOICES, 
        default='PENDING'
    )

    # 4. THE AUTOMATIC TIMESTAMP (Your Request)
    # auto_now_add=True: Sets time ONLY when created (Created At)
    # auto_now=True: Updates time EVERY time you save (Updated At)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Sort by newest bookings first
        ordering = ['-start_time']

    def __str__(self):
        return f"{self.name} - {self.start_time}"