from django.shortcuts import render
from django.urls import reverse_lazy
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.views.generic.base import TemplateView

from .models import Movie, Director, Actor
from .forms import  DirectorForm, ActorForm

# Create your views here.

class MovieListView(TemplateView):
    template_name = 'movie_list_view.html'


class MovieCreateView(CreateView):
    model = Movie
    template_name = 'movie_create_view.html'
    fields = ['movie_title', 'movie_date', 'movie_director', 'movie_actors']
    success_url = '/'

class MovieDetailView(DetailView):
    model = Movie
    template_name = 'movie_detail_view.html'
    object = 'movie'

class MovieUpdateView(UpdateView):
    model = Movie
    template_name = 'movie_create_view.html'
    fields = ['movie_title', 'movie_date', 'movie_director', 'movie_actors']
    success_url = reverse_lazy('home')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['update'] = True
        return context

    def get_success_url(self):
        return reverse_lazy('movie-detail', kwargs={'pk': self.object.pk})

class MovieDeleteView(DeleteView):
    model = Movie
    template_name = 'delete_confirm.html'
    success_url = '/'


class DirectorCreateView(CreateView):
    model = Director
    template_name = 'director_create_view.html'
    fields = ['director_name']
    success_url = '/'

class DirectorDetailView(DetailView):
    model = Director
    template_name = 'director_detail_view.html'
    object = 'director'

class DirectorUpdateView(UpdateView):
    model = Director
    template_name = 'director_create_view.html'
    fields = ['director_name']
    success_url = reverse_lazy('home')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['update'] = True
        return context

    def get_success_url(self):
        return reverse_lazy('director-detail', kwargs={'pk': self.object.pk})

class DirectorDeleteView(DeleteView):
    model = Director
    template_name = 'delete_confirm.html'
    success_url = '/'
    

class ActorCreateView(CreateView):
    model = Actor
    template_name = 'actor_create_view.html'
    fields = ['actor_name']
    success_url = '/'

class ActorDetailView(DetailView):
    model = Actor
    template_name = 'actor_detail_view.html'
    object = 'actor'

class ActorUpdateView(UpdateView):
    model = Actor
    template_name = 'actor_create_view.html'
    fields = ['actor_name']
    success_url = reverse_lazy('home')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['update'] = True
        return context

    def get_success_url(self):
        return reverse_lazy('actor-detail', kwargs={'pk': self.object.pk})

class ActorDeleteView(DeleteView):
    model = Actor
    template_name = 'delete_confirm.html'
    success_url = '/'