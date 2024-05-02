from django import forms
from .models import *


class SearchForm(forms.Form):
    search = forms.CharField()


class CreatePostForm(forms.Form):
    titulo = forms.CharField(max_length=100)
    subtitulo = forms.CharField(max_length=200)
    contenido = forms.CharField(max_length=2000, strip=False, widget=forms.Textarea())
