from django import forms

from .models import Director, Actor

class DirectorForm(forms.ModelForm):
    class Meta:
        model = Director
        fields = ['director_name']

class ActorForm(forms.ModelForm):
    class Meta:
        model = Actor
        fields = ['actor_name']