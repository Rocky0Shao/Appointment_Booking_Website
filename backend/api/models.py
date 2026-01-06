from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
import uuid

# ==========================================
# 1. MANAGER & USER (MUST BE FIRST)
# ==========================================

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class HostUser(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    booking_slug = models.SlugField(unique=True, blank=True, null=True)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = [] 

    def __str__(self):
        return self.email

# ==========================================
# 2. OTHER MODELS (COME SECOND)
# ==========================================

class TimeBlock(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Now this works because HostUser is defined above!
    user = models.ForeignKey(HostUser, on_delete=models.CASCADE, related_name='time_blocks')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    block_type = models.CharField(max_length=50, default="BLOCKED") 

    def __str__(self):
        return f"Blocked: {self.start_time} - {self.end_time}"

class Booking(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # This also works now
    user = models.ForeignKey(HostUser, on_delete=models.CASCADE, related_name='bookings')
    
    guest_name = models.CharField(max_length=100)
    guest_email = models.EmailField()
    note = models.TextField(blank=True, null=True)
    
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    
    status = models.CharField(max_length=20, default="CONFIRMED")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.guest_name} ({self.start_time})"