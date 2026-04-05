from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from django.contrib.auth import get_user_model
from .models import Post, Message, Avatar, Conversation

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    post_count = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'date_joined', 'post_count', 'avatar_url']

    def get_post_count(self, obj):
        return obj.posts.count()
        
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

    def validate_image(self, value):
        if value:
            # Limite 5MB de tamaño por avatar
            if value.size > 5 * 1024 * 1024:
                raise ValidationError("La imagen del avatar no puede exceder los 5MB")
        return value

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
        return getattr(obj, 'likes_count_annotated', obj.likes.count())

    def get_has_liked(self, obj):
        if hasattr(obj, 'has_liked_annotated'):
            return obj.has_liked_annotated
            
        request = self.context.get('request', None)
        if request and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False

class ConversationSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'updated_at', 'last_message']

    def get_last_message(self, obj):
        last = obj.messages.order_by('-time').first()
        if last:
            return {'sender_id': last.sender_id, 'content': last.content, 'time': last.time}
        return None

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    conversation_id = serializers.PrimaryKeyRelatedField(
        queryset=Conversation.objects.all(), source='conversation', write_only=True
    )

    class Meta:
        model = Message
        fields = ['id', 'conversation_id', 'sender', 'time', 'content']
