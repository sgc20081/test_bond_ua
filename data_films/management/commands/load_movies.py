import json
from django.core.management.base import BaseCommand
from data_films.models import Movie, Director, Actor

class Command(BaseCommand):
    help = 'Load books from JSON file'

    def add_arguments(self, parser):
        parser.add_argument('json_file', type=str, help='Path to JSON file')

    def handle(self, *args, **options):
        json_file_path = options['json_file']
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

            for film in data:
                movie = Movie.objects.create(movie_title=film['title'], movie_date=film['release_date'])
                for director in film['directors']:
                    movie_director, created = Director.objects.get_or_create(director_name=director['name'])
                    movie.movie_director.add(movie_director)
                for actor in film['cast']:
                    movie_actor, created = Actor.objects.get_or_create(actor_name=actor['name'])
                    movie.movie_actors.add(movie_actor)