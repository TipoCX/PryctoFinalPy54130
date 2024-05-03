from django.utils import timezone
from django.db import models
from django.contrib.auth import get_user_model

class Post(models.Model):
    titulo = models.CharField(max_length=100, blank=False, null=False)
    subtitulo = models.CharField(max_length=200, blank=True, null=True)
    contenido = models.TextField(max_length=2000, blank=False, null=False)
    time = models.DateTimeField(default=timezone.now)
    author = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, related_name='author')
    likes = models.ManyToManyField(get_user_model(), related_name='likes')

    def __str__(self):
        return f'{self.titulo}'

class Message(models.Model):
    sender = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, related_name='sender')
    reciver = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, related_name='reciver')
    time = models.DateTimeField(default=timezone.now)
    content = models.CharField(max_length=500, blank=False, null=False)



class Avatar(models.Model):
    user = models.OneToOneField(get_user_model(), on_delete=models.CASCADE)
    image = models.ImageField()
