$(document).ready(function(){

    let movie_api_request = new RelatedFieldAPIRequest({
        form: $('.api-form'),
        post_api_url: 'create-movie-api',
        update_api_url: '',
        related_api_urls: {'movie_directors': 'directors-api','movie_actors': 'actors-api'},
        option_tag: (object)=>{
            return {'movie_directors': `<option value="${object.id}" name="director_name">${object.director_name}</option>`,
            'movie_actors': `<option value="${object.id}" name="actor_name">${object.actor_name}</option>`}
        },
        success_request: (response)=>{
            window.location = `${window.location.origin}/movie-${response.id}`
        }
    });
});