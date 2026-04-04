from cProfile import label
from django import forms
from .models import *


class SearchForm(forms.Form):
    search = forms.CharField()


class CreatePostForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ['titulo', 'contenido']
        labels = {
            'titulo': 'Titulo Del Post',
            'contenido': 'Contenido Del Post'
        }

class SendMessageForm(forms.ModelForm):
    class Meta:
        model = Message
        fields = ['content']

class AvatarCreateForm(forms.ModelForm):
    class Meta:
        model = Avatar
        fields = ['image']
