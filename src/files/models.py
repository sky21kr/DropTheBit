from django.db import models
from django.conf import settings
from django.contrib.auth.models import User
# Create your models here.


class Folder(models.Model):
    name = models.CharField(max_length=200)
    owner = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="folders")
    parent = models.ForeignKey('self', on_delete=models.CASCADE,
                               related_name="child_folders", blank=True, null=True)

    rootof = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="root", blank=True, null=True)


class TestFile(models.Model):
    name = models.CharField(max_length=200)
    owner = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="files")
    parent = models.ForeignKey(
        Folder, on_delete=models.CASCADE, related_name="child_files", blank=True, null=True)
    size = models.IntegerField(default=0)
    modified = models.DateTimeField(auto_now=True)


class Share(models.Model):
    file_id = models.ForeignKey(
        TestFile, on_delete=models.CASCADE, related_name='shared_file')
    user_id = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='shared_users')
    owner_id = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='owner')
    mode = models.IntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['file_id', 'user_id', 'mode'], name='unique_share'),
        ]
