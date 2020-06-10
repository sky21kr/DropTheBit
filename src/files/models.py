from django.db import models
from django.conf import settings

# Create your models here.


class File(models.Model):
    name = models.CharField(max_length=200)
    photo = models.ImageField(upload_to='usr')


class test(models.Model):
    testfield = models.CharField(max_length=200)
    photo = models.ImageField(upload_to='usr')

    def __str__(self):
        return self.testfield
