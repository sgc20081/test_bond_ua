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
    movie_actors = ActorSerializer(many=True, read_only=True)
    movie_director = DirectorSerializer(many=True, read_only=True)
    movie_date = serializers.DateField(format='%Y-%m-%d')

    class Meta:
        model = Movie
        fields = [
            'id', 
            'movie_title', 
            'movie_date', 
            'movie_director', 
            'movie_actors'
            ]