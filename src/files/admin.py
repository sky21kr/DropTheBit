from django.contrib import admin

# Register your models here.
from .models import TestFile, Folder, Share

admin.site.register(TestFile)
admin.site.register(Folder)
admin.site.register(Share)
