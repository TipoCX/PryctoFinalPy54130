# Imports relacionados con views
from django.shortcuts import redirect, render
from django.http import HttpResponse

# Imports de modelos
from .models import *
from django.db.models import Q

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
        return render(request, 'post.html', context)
    elif request.method == 'POST':
        if request.user not in post.likes.all():
            post.likes.add(request.user)
            return render(request, 'post.html', context)
        else:
            post.likes.remove(request.user)
            return render(request, 'post.html', context)
