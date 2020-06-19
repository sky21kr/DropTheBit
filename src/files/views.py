from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponseRedirect, HttpResponse, JsonResponse
import base64
import hashlib
import hmac
import os
import time
import boto
from rest_framework import permissions, status, authentication
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
import boto3
from django.views.decorators.csrf import csrf_exempt, csrf_protect  # Add this
from .models import Folder, TestFile, Share
from django.conf import settings
from django.core import serializers
from django.contrib.auth.models import User
import json

AWS_ACCESS_KEY_ID = getattr(settings, "AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = getattr(settings, "AWS_SECRET_ACCESS_KEY")

s3 = boto3.client('s3',
                  aws_access_key_id=AWS_ACCESS_KEY_ID,
                  aws_secret_access_key=AWS_SECRET_ACCESS_KEY)

AWS_STORAGE_BUCKET_NAME = getattr(settings, "AWS_STORAGE_BUCKET_NAME")

# 파일 업로드, 작동함
@csrf_exempt
def upload(request, folder_id):
    folder = get_object_or_404(Folder, pk=folder_id)
    if folder.owner != request.user:
        return JsonResponse({
            'result': 'Upload failed. No permission'
        }, status=403)  # 403 forbidden

    for file in request.FILES.getlist('file'):
        if len(TestFile.objects.filter(name=file.name)) > 0:
            return JsonResponse({
                'result': 'Upload failed! A file that has same name already exists'
            }, status=500)
        total = 0
        items = TestFile.objects.filter(owner=request.user.id)
        for item in items:
            total += item.size
        total += file.size/1024

        if total > 31457280:
            response = {
                'result': 'Upload failed. The file size exceeds allowed storage volume.'
            }
            # 507 insufficient storage
            return JsonResponse(response, status=507)
        new_file = TestFile()
        new_file.name = file.name
        new_file.owner = request.user
        new_file.parent = folder
        new_file.size = file.size/1024
        new_file.save()
        try:
            s3.upload_fileobj(file, AWS_STORAGE_BUCKET_NAME, str(new_file.id), ExtraArgs={
                "ContentType": file.content_type})
        except Exception as e:
            TestFile.objects.get(pk=new_file.id).delete()
            return JsonResponse({
                'result': 'Upload failed!'
            }, status=500)
    return JsonResponse({
        'result': 'Upload completed!',
        'left_capacity': 31457280-total
    }, status=201)  # 201 created


@csrf_exempt
def download(request, file_id):
    file_name = TestFile.objects.filter(pk=file_id).first()
    conn = boto.connect_s3(AWS_ACCESS_KEY_ID,
                           AWS_SECRET_ACCESS_KEY)
    bucket = conn.get_bucket(AWS_STORAGE_BUCKET_NAME)
    s3_file_path = bucket.get_key(file_id)
    headers = {
        'response-content-type': 'application/force-download',
        'response-content-disposition': f'attachment;filename={file_name.name}'
    }
    url = s3_file_path.generate_url(
        response_headers=headers,
        expires_in=600)  # expiry time is in seconds
    return HttpResponse(url, status=200)

    # file_name = TestFile.objects.filter(pk=file_id).first()
    # s3.download_file(AWS_STORAGE_BUCKET_NAME, str(
    #     file_id), file_name.name)
    # return redirect('/account/login')


@csrf_exempt
def file_sharing(request, file_id):
    file = get_object_or_404(TestFile, pk=file_id, owner=request.user)
    if request.method == 'POST':
        user = request.POST['user']
        user_object = User.objects.filter(username=user).first()
        if user_object is not None:
            if Share.objects.filter(user_id=user_object.pk, file_id=file_id).first() is None:
                new_share = Share()
                new_share.file_id = file
                new_share.mode = request.POST['mode']
                new_share.user_id = user_object
                new_share.owner_id = request.user
                new_share.save()
            else:
                return HttpResponse(status=400)
        else:
            return HttpResponse(status=400)
    shares = Share.objects.filter(file_id=file_id)
    return HttpResponse(status=200)


def file_sharing_del(request, file_id):
    file = get_object_or_404(TestFile, pk=file_id)
    if file.owner != request.user:
        return HttpResponse(status=403)  # 403 forbidden
    shares = Share.objects.filter(file_id=file.pk)
    for share in shares:
        share.delete()
    return HttpResponse(status=200)


@csrf_exempt
def rename_file(request, file_id):
    file = get_object_or_404(TestFile, pk=file_id)
    is_share = Share.objects.filter(
        file_id=file_id, user_id=request.user.pk).first()
    if file.owner == request.user or (is_share is not None and is_share.mode == 1):
        if request.method == 'POST':
            file.name = request.POST['new_name']
            file.save()
        return HttpResponse(request, status=201)  # 201 created
    else:
        return HttpResponse(status=403)


@csrf_exempt
def rename_folder(request, folder_id):
    folder = get_object_or_404(Folder, pk=folder_id)
    if folder.owner != request.user:
        return HttpResponse(status=403)  # 403 forbidden
    if request.method == 'POST':
        folder.name = request.POST['new_name']
        folder.save()
    return HttpResponse(request, status='201')  # 201 created


def FolderToDict(folder):
    result = dict()
    result['name'] = folder.name
    result['id'] = folder.id
    result['owner'] = folder.owner.username
    return result


def FileToDict(file):
    result = dict()
    result['name'] = file.name
    result['id'] = file.id
    result['size'] = file.size
    result['date'] = file.modified
    result['owner'] = file.owner.username
    return result


def ListAPI(request, folder_id):
    if request.method == 'GET':
        folder = get_object_or_404(Folder, pk=folder_id)
        if folder.owner != request.user:
            return HttpResponse(status=403)  # 403 forbidden
        # listing child folders
        child_folders = folder.child_folders.all()
        child_folders = map(FolderToDict, child_folders)
        child_folders = list(child_folders)
        # listing child files
        child_files = folder.child_files.all()
        child_files = map(FileToDict, child_files)
        child_files = list(child_files)
        # responsing json data
        response = {
            'folders': child_folders,
            'files': child_files,
        }
        return JsonResponse(response, status=200)  # 200 success


@csrf_exempt
def copy_file(request, file_id):
    file = get_object_or_404(TestFile, id=file_id)
    if file.owner != request.user:
        return HttpResponse(status=403)  # 403 forbidden
    total = 0
    items = TestFile.objects.filter(owner=request.user.id)

    for item in items:
        total += item.size
    total += file.size

    if total > 31457280:
        response = {
            'result': 'Copy failed. The file size exceeds allowed storage volume.'
        }
        # 507 insufficient storage
        return JsonResponse(response, status=507)
    final = file.name
    new_file = TestFile()
    while len(TestFile.objects.filter(name=final)) > 0:
        strlist = final.rsplit('.')
        strlist.insert(1, '_copy.')
        final = ""
        for sub in strlist:
            final += sub
    new_file.name = final
    new_file.owner = file.owner
    new_file.parent = file.parent
    new_file.size = file.size
    new_file.save()
    s3.copy_object(Bucket=AWS_STORAGE_BUCKET_NAME,
                   CopySource=AWS_STORAGE_BUCKET_NAME+"/" + str(file.id), Key=str(new_file.id))
    return JsonResponse({
        'result': 'Copy completed!',
        'left_capacity': 31457280-total
    }, status=201)  # 201 created


def share_list(request):
    is_share = Share.objects.filter(user_id=request.user.pk)
    mylist = []
    for item in is_share:
        file = dict()
        file['id'] = item.file_id.id
        file['name'] = item.file_id.name
        file['owner'] = item.file_id.owner.username
        file['size'] = item.file_id.size
        file['date'] = item.file_id.modified
        mylist.append(file)
    return JsonResponse({
        'files': mylist
    }, status=200)  # 200 success


@csrf_exempt
def create_folder(request):
    if len(Folder.objects.filter(name=request.POST['folderName'])) > 0:
        return JsonResponse({
            'result': 'Folder creation failed! A folder that has same name already exists'
        })
    folder = get_object_or_404(Folder, pk=request.POST['currentFolderKey'])

    if folder.owner != request.user:
        return HttpResponse(status=403)  # 403 forbidden
    new_folder = Folder()
    new_folder.name = request.POST['folderName']
    new_folder.owner = request.user
    new_folder.parent = folder
    new_folder.save()

    return HttpResponse(status=200)


@csrf_exempt
def get_capacity(request):
    total = 0
    items = TestFile.objects.filter(owner=request.user.id)
    for item in items:
        total += item.size
    return JsonResponse({
        'left_capacity': 31457280-total
    }, status='200')  # 200 success


def FileToDictWithPath(file):
    result = FileToDict(file)
    result['parent'] = file.parent.id
    return result

 # search all folders and files by name


def SearchAPI(request, target):
    if request.method == 'GET':
        # query proper files
        files = request.user.files
        files = files.filter(name__icontains=target)
        # convert to json data
        files = map(FileToDictWithPath, files)
        files = list(files)
        # responsing json data
        response = {
            'files': files,
        }
        return JsonResponse(response, status=200)


@csrf_exempt
def delete_file(request, file_id):
    if request.method == 'DELETE':
        file = get_object_or_404(TestFile, pk=file_id)
        if file == None:
            # 404 not found
            return JsonResponse({'result': 'fail', 'error': 'no such file'}, status=404)
        if file.owner != request.user:
            # 403 forbidden
            return JsonResponse({'result': 'fail', 'error': 'no permission'}, status=403)
        result = s3.delete_object(
            Bucket=AWS_STORAGE_BUCKET_NAME,
            Key=str(file_id),
        )
        file.delete()
        return JsonResponse({'result': 'success'}, status=201)  # 201 created


@csrf_exempt
def partial_delete_folder(folder):
    child_folders = folder.child_folders.all()
    for child_folder in child_folders:
        partial_delete_folder(child_folder)
    child_files = folder.child_files.all()
    for child_file in child_files:
        file_id = child_file.id
        s3.delete_object(
            Bucket=AWS_STORAGE_BUCKET_NAME,
            Key=str(file_id),
        )
        child_file.delete()
    folder.delete()


@csrf_exempt
def delete_folder(request, folder_id):
    if request.method == 'DELETE':
        folder = get_object_or_404(Folder, pk=folder_id)
        if folder == None:
            # 404 not found
            return JsonResponse({'result': 'fail', 'error': 'no such folder'}, status=404)
        if folder.owner != request.user:
            # 403 forbidden
            return JsonResponse({'result': 'fail', 'error': 'no permission'}, status=403)
        partial_delete_folder(folder)
        return JsonResponse({'result': 'success'}, status=201)  # 201 created
