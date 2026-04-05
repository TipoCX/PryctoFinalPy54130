from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Count, OuterRef, Exists
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from .models import Post, Message, Avatar, Conversation
from .serializers import (
    UserSerializer, UserCreateSerializer, PostSerializer, 
    MessageSerializer, AvatarSerializer, ConversationSerializer
)

User = get_user_model()

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class AvatarViewSet(viewsets.ModelViewSet):
    queryset = Avatar.objects.all()
    serializer_class = AvatarSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        Avatar.objects.filter(user=self.request.user).delete()
        serializer.save(user=self.request.user)

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = Post.objects.select_related('author').annotate(
            likes_count_annotated=Count('likes', distinct=True)
        ).order_by('-time')
        
        if self.request.user.is_authenticated:
            user_likes = Post.likes.through.objects.filter(post_id=OuterRef('pk'), user_id=self.request.user.id)
            queryset = queryset.annotate(has_liked_annotated=Exists(user_likes))

        author_id = self.request.query_params.get('author', None)
        liked_by = self.request.query_params.get('liked_by', None)
        
        if author_id is not None:
            queryset = queryset.filter(author__id=author_id)
        if liked_by is not None:
            queryset = queryset.filter(likes__id=liked_by)
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        post = self.get_object()
        user = request.user
        if user in post.likes.all():
            post.likes.remove(user)
            liked = False
        else:
            post.likes.add(user)
            liked = True
        return Response({
            'status': 'like toggled',
            'liked': liked,
            'likes_count': post.likes.count()
        })

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user).order_by('-updated_at')

    def create(self, request, *args, **kwargs):
        participant_ids = request.data.get('participants', [])
        if request.user.id not in participant_ids:
            participant_ids.append(request.user.id)
            
        # Verificamos si ya existe un chat "1 a 1" exacto para evitar duplicados si son 2 personas
        if len(participant_ids) == 2:
            existing = Conversation.objects.filter(participants=participant_ids[0]).filter(participants=participant_ids[1])
            if existing.exists():
                return Response(self.get_serializer(existing.first()).data, status=status.HTTP_200_OK)

        conversation = Conversation.objects.create()
        conversation.participants.set(participant_ids)
        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.request.query_params.get('conversation')
        if conversation_id:
            try:
                conv = Conversation.objects.get(id=conversation_id, participants=self.request.user)
                return Message.objects.filter(conversation=conv).order_by('time')
            except Conversation.DoesNotExist:
                return Message.objects.none()
        return Message.objects.none()

    def perform_create(self, serializer):
        conversation = serializer.validated_data['conversation']
        if self.request.user in conversation.participants.all():
            conversation.save() # auto_now=True fuerza actualizacion
            serializer.save(sender=self.request.user)
