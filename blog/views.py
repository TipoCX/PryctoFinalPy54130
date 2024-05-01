from django.shortcuts import render
from django.http import HttpResponse
from django.contrib.auth.forms import AuthenticationForm

# Create your views here.
def indexView(request):
    return HttpResponse("<h1>Creado</h1>")

def loginView(request):
    if request.method == "GET":
        form = AuthenticationForm()
        context = {'form': form}
    elif request.method == 'POST':
        return HttpResponse('<h1 style="margin:20px;">la respuesta de este formulario no fue creada todavia</h1>')
    return render(request, "login.html", context)
