# bookings/models.py
from django.db import models
from django.contrib.auth.models import User

class Appointment(models.Model):
    # This automatically links to the User table
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()
    time = models.TimeField()
    reason = models.TextField()
    is_approved = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - {self.date}"