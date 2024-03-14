from rest_framework import serializers
from .models import Movie, Director, Actor

class DirectorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Director
        fields = ['id', 'director_name']

class ActorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Actor
        fields = ['id', 'actor_name']

class MovieSerializer(serializers.ModelSerializer):
    movie_actors = ActorSerializer(many=True)
    movie_director = DirectorSerializer(many=True)
    movie_date = serializers.DateField(format='%d.%m.%Y')

    class Meta:
        model = Movie
        fields = [
            'id', 
            'movie_title', 
            'movie_date', 
            'movie_director', 
            'movie_actors',
            'movie_director'
            ]