from rest_framework import generics, pagination, renderers, response, status
from django_filters import rest_framework as filters
from django.db import models


from .filters import MovieFilter
from .serializers import MovieSerializer, DirectorSerializer, ActorSerializer
from .models import Movie, Director, Actor

class MoviePagination(pagination.PageNumberPagination):
    page_size = 25

    def get_paginated_response(self, data):
        response = super().get_paginated_response(data)
        response.data['last_page'] = self.page.paginator.num_pages
        response.data['page'] = self.page.number
        return response

class MovieListAPI(generics.ListCreateAPIView):
    queryset = Movie.objects.all()
    serializer_class = MovieSerializer
    renderer_classes = [renderers.JSONRenderer]
    pagination_class = MoviePagination
    filterset_class = MovieFilter
    filter_backends = [filters.DjangoFilterBackend]

class DirectorListAPI(generics.ListCreateAPIView):
    queryset = Director.objects.all()
    serializer_class = DirectorSerializer
    renderer_classes = [renderers.JSONRenderer]

    # def get(self, request, *args, **kwargs):
    #     context = super().get(request, *args, **kwargs)
    #     for field in Director._meta.get_fields():
    #         if not isinstance(field, models.ManyToManyRel):
    #             print(field.name)
    #         else:
    #             print('This is ManyToMany field')
    #     print(context.data)
    #     return context

class ActorListAPI(generics.ListCreateAPIView):
    queryset = Actor.objects.all()
    serializer_class = ActorSerializer
    renderer_classes = [renderers.JSONRenderer]

class MovieCreateAPI(generics.CreateAPIView):
    serializer_class = MovieSerializer
    renderer_classes = [renderers.JSONRenderer]

    def post(self, request, *args, **kwargs):
        # Получаем данные из запроса
        request_data = request.data
        # Создаём сериализатор с полученными данными
        serializer = self.get_serializer(data=request_data)

        if serializer.is_valid():
            # Сохраняем сериализованные данные и создаем фильм
            movie = serializer.save()
            
            # Получаем связанные объекты
            directors = request_data.get('movie_directors')
            actors = request_data.get('movie_actors')

            # Устанавливаем связи many-to-many
            if directors:
                movie.movie_director.set(director['id'] for director in directors)
            if actors:
                movie.movie_actors.set(actor['id'] for actor in actors)

            response_data = serializer.data
            # response_data['success_url'] = 'test-url'
            return response.Response(response_data, status=status.HTTP_201_CREATED)
        else:
            # Выводим ошибки в консоль или логируем их на сервере
            print(serializer.errors)
            return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MovieUpdateAPI(generics.UpdateAPIView):
    queryset = Movie.objects.all()
    serializer_class = MovieSerializer

class MovieDetailAPI(generics.RetrieveAPIView):
    queryset = Movie.objects.all()
    serializer_class = MovieSerializer