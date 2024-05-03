"""
URL configuration for mysite project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
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
from django.urls import path
from .views import *


urlpatterns = [
    path('', indexView, name='home'),
    path('login', loginView, name='login'),
    path('logout', logoutView, name='logout'),
    path('post/<postid>', postView, name='post'),
    path('register', registerView, name='register'),
    path('create_post', createPostView, name='create-post'),
    path('update_post/<postid>', updatePostView, name='update-post'),
    path('delete_post/<postid>', deletePostView, name='delete-post'),
    path('profile/<pageUserId>', profileView, name='profile-view'),
    path('messages', messageHubView, name='message-hub'),
    path('dm/<contact>', dmView, name='dm'),
    path('add_avatar', avatarView, name='add-avatar')
]
