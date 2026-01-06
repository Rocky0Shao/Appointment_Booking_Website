from django.contrib import admin
from .models import HostUser, TimeBlock

# This tells the Admin panel to show these models
admin.site.register(HostUser)
admin.site.register(TimeBlock)