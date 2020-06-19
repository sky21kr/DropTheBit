from django.shortcuts import render
from rest_framework import generics, status
from django.contrib.auth.models import User
from rest_framework import permissions
from rest_framework import renderers
from rest_framework.renderers import TemplateHTMLRenderer
from rest_framework import viewsets
from client.permissions import IsOwnerOrReadOnly
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt, csrf_protect  # Add this
import json
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.reverse import reverse
from .serializers import CreateUserSerializer, LoginUserSerializer, UserSerializer
from knox.models import AuthToken
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from django.contrib.auth import login as auth_login, logout as auth_logout
from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.conf import settings
from django.http import JsonResponse
# import for makeing root folder when creating user
from files.models import TestFile, Folder


def home(request):
    return render(request, 'home.html')


@csrf_exempt
def login(request):
    if request.method == "POST":
        username = request.POST['id']
        password = request.POST['password']
        user = authenticate(username=username, password=password)
        if user is not None:
            auth_login(request, user)
            root_folder_id = user.root.all()[0].id
            return render(request, 'main.html', {'rootFolderId': root_folder_id})
        else:
            return redirect('/')
    else:
        if request.user.is_active:
            root_folder_id = request.user.root.all()[0].id
            return render(request, 'main.html', {'rootFolderId': root_folder_id})
        else:
            return redirect('/')


@csrf_exempt
def signup(request):
    if request.method == "POST":
        if request.POST["password1"] == request.POST["password2"]:
            user = User.objects.create_user(
                username=request.POST["id"],
                password=request.POST["password1"],
                email=request.POST["email"],
                last_name=request.POST["nickname"]
            )
            root = Folder()
            root.name = ''
            root.owner = user
            root.rootof = user
            root.save()
            return JsonResponse(data={}, status=status.HTTP_201_CREATED)
        return JsonResponse(data={}, status=status.HTTP_400_BAD_REQUEST)
    return JsonResponse(data={}, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
def logout(request):
    auth_logout(request)
    return redirect('/')


# 프론트 더미 데이터 테스트용
@csrf_exempt
def test(request):
    context = {'folders': [{'id': '2', 'name': '테스트폴더', 'owner': '테스트폴더주인', 'date': '테스트폴더날짜'}, {'id': '4', 'name': '테스트폴더2', 'owner': '테스트폴더주인2', 'date': '테스트폴더2날짜'}], 'files': [
        {'id': '파일ID1', 'filename': '테스트파일1', 'size': '12MB', 'owner': '테스트파일1주인'}, {'id': '파일ID2', 'filename': '테스트파일2', 'size': '10MB', 'owner': '테스트파일2주인'}]}
    return HttpResponse(json.dumps(context), content_type="application/json")
