import json
from django.core.management.base import BaseCommand
from data_films.models import Movie, Director, Actor

class Command(BaseCommand):
    help = 'Load books from JSON file'

    def add_arguments(self, parser):
        parser.add_argument('json_file', type=str, help='Path to JSON file')

    def handle(self, *args, **options):
        json_file_path = options['json_file']
        with open(json_file_path, 'r') as f:
            data = json.load(f)
            for item in data:
                print(item)