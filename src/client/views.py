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


def home(request):
    return render(request, 'home.html')

# # 경우의 따른 data값 반납 필요
# @csrf_exempt
# def login(request):
#     id = request.POST.get('id', None)
#     password = request.POST.get('password', None)
#     print(id, password)
#     # 로그인 실패
#     # return render(request, 'home.html', {'data': "There is no matching user information"})
#     # 로그인 성공

#     return render(request, 'main.html', {"token": 1234})


@csrf_exempt
def login(request):
    if request.method == "POST":
        username = request.POST['id']
        password = request.POST['password']
        user = authenticate(username=username, password=password)
        if user is not None:
            auth_login(request, user)
            return render(request, 'main.html')
        else:
            return redirect('/')
    else:
        return render(request, 'main.html')


# @csrf_exempt
# def signup(request):
#     user = request.POST.get('user', None)
#     print(user)
#     return HttpResponse("123")


@csrf_exempt
def signup(request):
    if request.method == "POST":
        if request.POST["password1"] == request.POST["password2"]:
            User.objects.create_user(
                username=request.POST["id"],
                password=request.POST["password1"],
                email=request.POST["email"],
                last_name=request.POST["nickname"]
            )
            return JsonResponse(data={}, status=status.HTTP_201_CREATED)
        return JsonResponse(data={}, status=status.HTTP_400_BAD_REQUEST)
    return JsonResponse(data={}, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
def logout(request):
    auth_logout(request)
    return redirect('/')


@csrf_exempt
def test(request):
    print(request.POST["folderName"])
    context = request.POST
    print(context)
    return HttpResponse(json.dumps(context), content_type="application/json")
