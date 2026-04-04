from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from django.contrib.auth import get_user_model
from .models import Post, Message, Avatar

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    post_count = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'date_joined', 'post_count', 'avatar_url']

    def get_post_count(self, obj):
        return obj.author.count()
        
    def get_avatar_url(self, obj):
        if hasattr(obj, 'avatar') and obj.avatar.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.image.url)
            return obj.avatar.image.url
        return None

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

class AvatarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Avatar
        fields = ['id', 'user', 'image']

class PostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    likes_count = serializers.SerializerMethodField()
    has_liked = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'titulo', 'contenido', 'time', 'author', 'likes_count', 'has_liked', 'imagen', 'imagen_borrada']

    def validate_imagen(self, value):
        if value:
            # Limite 5MB
            if value.size > 5 * 1024 * 1024:
                raise ValidationError("La imagen no puede exceder los 5MB")
        return value

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_has_liked(self, obj):
        request = self.context.get('request', None)
        if request and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    reciver = UserSerializer(read_only=True)
    reciver_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='reciver', write_only=True
    )

    class Meta:
        model = Message
        fields = ['id', 'sender', 'reciver', 'reciver_id', 'time', 'content']
