import django_filters as dj_fil
from .models import Movie

class MovieFilter(dj_fil.FilterSet):
    year = dj_fil.DateFilter(field_name='movie_date', input_formats=['%d.%m.%Y']) # year - название параметра GET который будет использоваться
    director = dj_fil.CharFilter(field_name='movie_director__director_name')
    actor = dj_fil.CharFilter(field_name='movie_actors__actor_name')