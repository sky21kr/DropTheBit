from django import forms

from .models import test


class UploadFileForm(forms.ModelForm):
    class Meta:
        model = test
        fields = ('testfield', 'photo')
