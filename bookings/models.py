from django.db import models

class Booking(models.Model):

    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True, null=True)


    start_time = models.DateTimeField()
    duration_minutes = models.IntegerField(default=30)

