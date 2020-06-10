from django.shortcuts import render
from django.http import HttpResponseRedirect, HttpResponse
import base64
import hashlib
import hmac
import os
import time
from rest_framework import permissions, status, authentication
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import *
from rest_framework import status
from .forms import UploadFileForm
import boto3
from django.views.decorators.csrf import csrf_exempt, csrf_protect  # Add this
from .models import test

from django.conf import settings


@csrf_exempt
def testing(request):
    # request.POST.get('fileType')
    print(request.FILES)
    return HttpResponse("123")


@csrf_exempt
def upload_file(request):
    print(request.POST)
    file = test()
    file.save()
    if request.method == 'POST':
        print(request.FILES)
        form = UploadFileForm(request.POST, request.FILES)
        if form.is_valid():
            print("save")
            form.save()
            return HttpResponseRedirect('/success/url/')
    else:
        form = UploadFileForm()
    return render(request, 'test.html', {'form': form})
