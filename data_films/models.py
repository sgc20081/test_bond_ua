from django.db import models

# Create your models here.


class Director(models.Model):

    director_name = models.CharField(max_length=20)

    def __str__(self):
        return self.director_name

class Actor(models.Model):

    actor_name = models.CharField(max_length=20)

    def __str__(self):
        return self.actor_name

class Movie(models.Model):

    movie_title = models.CharField(max_length=20)
    movie_date = models.DateField()
    movie_director = models.ManyToManyField(Director)
    movie_actors = models.ManyToManyField(Actor)

    def __str__(self):
        return self.movie_title