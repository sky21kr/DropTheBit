"""DroptheBit URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.conf.urls import url
from django.urls import path
from django.views.generic.base import TemplateView
from files.views import upload, upload, download, file_sharing, file_sharing_del, rename_file, ListAPI, rename_folder, copy_file, share_list, create_folder, get_capacity, SearchAPI, delete_file, delete_folder
import client.views

urlpatterns = [
    url('admin/', admin.site.urls),
    path('', client.views.home, name='home'),
    path('account/login/', client.views.login, name='login'),
    path('account/logout', client.views.logout, name='logout'),
    path('account/signup/', client.views.signup, name='signup'),

    path('list/<int:folder_id>', ListAPI, name='list'),

    path('copy/<int:file_id>', copy_file, name='copy_file'),

    path('upload/<int:folder_id>', upload, name='upload'),
    path('file/<int:file_id>/download', download, name='download'),
    path('folderAdd', create_folder, name='create_folder'),

    path('file/<int:file_id>/rename', rename_file, name='rename'),
    path('folder/<int:folder_id>/rename', rename_folder, name='rename_folder'),

    path('file/<int:file_id>/share', file_sharing, name='shared'),
    path('file/<int:file_id>/share_del', file_sharing_del, name='shared_del'),
    path('file/<int:file_id>', delete_file, name='delete_file'),

    path('search/<str:target>', SearchAPI, name='search'),

    path('capacity', get_capacity, name='get_capacity'),
    path('shared', share_list, name='share_list'),

    path('file/<int:file_id>', delete_file, name='delete_file'),
    path('folder/<int:folder_id>', delete_folder, name='delete_folder'),
]
