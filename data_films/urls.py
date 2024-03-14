from django.urls import path, re_path
from . import views, apis

urlpatterns = [
    path('', views.MovieListView.as_view(), name='movies-list-view'),

    path('create-movie', views.MovieCreateView.as_view(), name='create-movie'),
    path('create-director', views.DirectorCreateView.as_view(), name='create-director'),
    path('create-actor', views.ActorCreateView.as_view(), name='create-actor'),

    path('update-movie', views.MovieUpdateView.as_view(), name='update-movie'),

    re_path(r'^movie-(?P<pk>\d+)$', views.MovieDetailView.as_view(), name='movie-detail'),
    re_path(r'^director-(?P<pk>\d+)$', views.DirectorDetailView.as_view(), name='director-detail'),
    re_path(r'^actor-(?P<pk>\d+)$', views.ActorDetailView.as_view(), name='actor-detail'),

    re_path(r'^update-movie-(?P<pk>\d+)$', views.MovieUpdateView.as_view(), name='update-movie'),
    re_path(r'^update-director-(?P<pk>\d+)$', views.DirectorUpdateView.as_view(), name='update-director'),
    re_path(r'^update-actor-(?P<pk>\d+)$', views.ActorUpdateView.as_view(), name='update-actor'),

    re_path(r'^delete-movie-(?P<pk>\d+)$', views.MovieDeleteView.as_view(), name='delete-movie'),
    re_path(r'^delete-director-(?P<pk>\d+)$', views.DirectorDeleteView.as_view(), name='delete-director'),
    re_path(r'^delete-actor-(?P<pk>\d+)$', views.ActorDeleteView.as_view(), name='delete-actor'),
]

# API urls
urlpatterns += [
    path('movies-api', apis.MovieList.as_view()),
]