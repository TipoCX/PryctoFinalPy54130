from django.utils import timezone
from django.db import models
from django.contrib.auth import get_user_model

class Post(models.Model):
    titulo = models.CharField(max_length=100, blank=False, null=False)
    subtitulo = models.CharField(max_length=200, blank=True, null=True)
    contenido = models.TextField(max_length=200, blank=False, null=False)
    time = models.DateTimeField(default=timezone.now)
    author = models.ForeignKey(get_user_model())

    def __str__(self):
        return f'{self.id} {self.title}'
