from rest_framework import serializers
from .models import *


class PhotoSerializer(serializers.ModelSerializer):
    class Mata:
        model = test
        fields = ('__all__')
