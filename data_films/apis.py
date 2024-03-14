from rest_framework import generics, pagination, renderers
from django_filters import rest_framework as filters

from .filters import MovieFilter
from .serializers import MovieSerializer
from .models import Movie

class MoviePagination(pagination.PageNumberPagination):
    page_size = 25

    def get_paginated_response(self, data):
        response = super().get_paginated_response(data)
        response.data['last_page'] = self.page.paginator.num_pages
        response.data['page'] = self.page.number
        return response

class MovieList(generics.ListCreateAPIView):
    queryset = Movie.objects.all()
    serializer_class = MovieSerializer
    renderer_classes = [renderers.JSONRenderer]
    pagination_class = MoviePagination
    filterset_class = MovieFilter
    filter_backends = (filters.DjangoFilterBackend,)