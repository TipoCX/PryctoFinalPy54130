# Imports relacionados con views
from django.shortcuts import redirect, render
from django.http import HttpResponse

# Imports de modelos
from .models import *
from django.db.models import Q
from django.contrib.auth.models import User

# Imports de Forms
from .forms import *

# Imports relcaionados con Cuentas de usuario
from django.contrib.auth import logout
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required


@login_required
def indexView(request):
    form = SearchForm()
    if request.method == 'GET':
        posts: list = Post.objects.all()
        context = {'posts': posts, 'form':form}
        return render(request, "index.html", context)
    elif request.method == 'POST':
        form = SearchForm(request.POST)
        if form.is_valid():
            search = form.cleaned_data['search']
            posts: list = Post.objects.filter(Q(titulo__contains = search) | Q(subtitulo__contains = search) | Q(contenido__contains = search) | Q(author__username__contains = search))
            context = {'posts': posts, 'form':form}
            return render(request, "index.html", context)


def loginView(request):
    if request.method == "GET":
        form = AuthenticationForm()
        context = {'form': form}
    elif request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        context = {'form': form}
        if form.is_valid():
            user = form.user_cache
            context = {}
            if user is not None:
                login(request, user)
                return redirect("home")
    return render(request, "login.html", context)

def registerView(request):
    if request.method == 'GET':
        form = UserCreationForm()
        context = {'form': form}
    elif request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('login')
    return render(request, "register.html", context)

@login_required
def createPostView(request):
    if request.method == 'GET':
        form = CreatePostForm()
        return render(request, 'create_post.html', {'form': form})
    elif request.method == 'POST':
        form = CreatePostForm(request.POST)
        if form.is_valid():
            titulo = form.cleaned_data['titulo']
            subtitulo = form.cleaned_data['subtitulo']
            contenido = form.cleaned_data['contenido']
            post = Post(titulo=titulo, subtitulo=subtitulo, contenido=contenido, author=request.user)
            post.save()
        return redirect('home')


@login_required
def logoutView(request):
    logout(request)
    return redirect('login')

@login_required
def postView(request, postid):
    post = Post.objects.filter(id=postid)[0]
    likes = post.likes.all()
    context = {'post': post, 'likes': likes}
    if request.method == 'GET':
        if Avatar.objects.filter(user=post.author).exists():
            avatar = Avatar.objects.filter(user=post.author)[0]
            context = {'post': post, 'likes': likes, 'avatar': avatar}
            return render(request, 'post.html', context)
        else:
            return render(request, 'post.html', context)
    elif request.method == 'POST':
        if request.user not in post.likes.all():
            post.likes.add(request.user)
            return render(request, 'post.html', context)
        else:
            post.likes.remove(request.user)
            return render(request, 'post.html', context)


@login_required
def profileView(request, pageUserId):
    profile = User.objects.filter(id=pageUserId)[0]
    posts = Post.objects.filter(author=pageUserId).all
    if Avatar.objects.filter(user=pageUserId).exists():
        avatar = Avatar.objects.filter(user=pageUserId)[0]
        return render(request, 'profile.html', {'profile': profile, 'avatar': avatar, 'posts': posts})
    else:
        return render(request, 'profile.html', {'profile': profile, 'posts': posts})


@login_required
def avatarView(request):
    if request.method == "GET":
        contexto = {"form": AvatarCreateForm()}
    else:
        form = AvatarCreateForm(request.POST, request.FILES)
        if form.is_valid():
            image = form.cleaned_data["image"]
            avatar_existente = Avatar.objects.filter(user=request.user)
            avatar_existente.delete()
            nuevo_avatar = Avatar(image=image, user=request.user)
            nuevo_avatar.save()
            return redirect("home")
        else:
            contexto = {"form": form}
    return render(request, "add_avatar.html", context=contexto)

@login_required
def updatePostView(request, postid):
    if Post.objects.filter(id=postid).exists():
        post = Post.objects.filter(id=postid)[0]
        if request.user == post.author:
            form = CreatePostForm(request.POST or None, instance=post)
            if form.is_valid():
                post.titulo = form.cleaned_data['titulo']
                post.subtitulo = form.cleaned_data['subtitulo']
                post.contenido = form.cleaned_data['contenido']
                post.save()
                return redirect('post', postid=post.id)
            context = {'form': form, 'post': post}
            return render(request, 'update_post.html', context)
    return redirect('home')

@login_required
def updateUserView(request):
    form = UserCreationForm(request.POST or None, instance=request.user)
    if form.is_valid():
        form.save()
        return redirect('profile-view', pageUserId=request.user.id)
    context = {'form': form}
    return render(request, 'update_user.html', context)

@login_required
def deletePostView(request, postid):
    if Post.objects.filter(id=postid).exists():
        post = Post.objects.filter(id=postid)[0]
        if request.user == post.author:
            post.delete()
    return redirect('home')

@login_required
def messageHubView(request):
    context = {}
    users = User.objects.all()
    context['users'] = users
    return render(request, 'mensajeria.html', context)

@login_required
def dmView(request, contact):
    context = {'form': SendMessageForm()}
    if User.objects.filter(id=contact).exists():
        contact = User.objects.filter(id=contact)[0]
        if request.method == 'GET':
            messages = Message.objects.filter((Q(sender=request.user)&Q(reciver=contact))|(Q(sender=contact)&Q(reciver=request.user))).order_by('time').all()
            context['contact'] = contact
            context['messages'] = messages
            return render(request, 'mensajeria-dm.html', context)
        elif request.method == 'POST':
            form = SendMessageForm(request.POST)
            if form.is_valid():
                content = form.cleaned_data['content']
                message = Message(content=content, sender=request.user, reciver=contact)
                message.save()
                return redirect('dm', contact.id)
    else:
        return redirect('message-hub')

@login_required
def deleteUserView(request):
    if request.method == 'GET':
        return render(request, 'alerta.html')
    elif request.method == 'POST':
        request.user.delete()
        request.user.save()
        return redirect('logout')

def aboutMeView(request):
    return render(request, 'about_me.html')
