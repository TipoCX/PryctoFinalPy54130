from django.utils import timezone
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import FileExtensionValidator
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import Sum

class Post(models.Model):
    titulo = models.CharField(max_length=100, blank=False, null=False)
    contenido = models.TextField(max_length=2000, blank=False, null=False)
    time = models.DateTimeField(default=timezone.now, db_index=True)
    author = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, related_name='posts')
    likes = models.ManyToManyField(get_user_model(), related_name='likes')
    
    imagen = models.ImageField(
        upload_to='posts/',
        null=True,
        blank=True,
        validators=[FileExtensionValidator(['png', 'jpg', 'jpeg', 'webp'])]
    )
    imagen_borrada = models.BooleanField(default=False)

    def __str__(self):
        return f'{self.titulo}'


class Conversation(models.Model):
    participants = models.ManyToManyField(get_user_model(), related_name='conversations')
    updated_at = models.DateTimeField(auto_now=True)

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, related_name='sent_messages')
    time = models.DateTimeField(default=timezone.now, db_index=True)
    content = models.CharField(max_length=500, blank=False, null=False)

    class Meta:
        ordering = ['time']
        indexes = [
            models.Index(fields=['conversation', 'time']),
        ]

class Avatar(models.Model):
    user = models.OneToOneField(get_user_model(), on_delete=models.CASCADE)
    image = models.ImageField(upload_to='avatars/', validators=[FileExtensionValidator(['png', 'jpg', 'jpeg', 'webp'])])

class ImageQueue(models.Model):
    post = models.OneToOneField(Post, on_delete=models.CASCADE)
    size = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

GLOBAL_IMAGE_LIMIT_BYTES = 50 * 1024 * 1024 # Limitado a 50 MB

@receiver(post_save, sender=Post)
def manage_image_quota(sender, instance, created, **kwargs):
    if instance.imagen and not instance.imagen_borrada:
        if not ImageQueue.objects.filter(post=instance).exists():
            size = instance.imagen.size
            ImageQueue.objects.create(post=instance, size=size)
            
            total_size_dict = ImageQueue.objects.aggregate(Sum('size'))
            total_size = total_size_dict['size__sum'] or 0
            
            if total_size > GLOBAL_IMAGE_LIMIT_BYTES:
                excess = total_size - GLOBAL_IMAGE_LIMIT_BYTES
                freed = 0
                for queue_item in ImageQueue.objects.all():
                    if freed >= excess:
                        break
                    
                    related_post = queue_item.post
                    if related_post.imagen:
                        related_post.imagen.delete(save=False)
                        related_post.imagen_borrada = True
                        related_post.save(update_fields=['imagen', 'imagen_borrada'])
                    
                    freed += queue_item.size
                    queue_item.delete()
