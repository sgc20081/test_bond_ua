$(document).ready(function() {

    movies_api_url = new UrlParametres(`${window.location.origin}/movies-api`);
    progress_loader = new LoadingAnimation({parent_el: $('.movies_rows'), text: 'Загрузка списка фильмов'});
    
    movies_api_request();
    main_function();
});


// ===================================================================================
// Class for interacting with GET parameters

class UrlParametres {
    constructor(url) {
        
        this.original_url = url;
        this.cleaned_url = '';
        this.url = url;
        this.params_str = '';
        this.params = {};

        this.__init__();
    };

    __init__(){
        this.cleaned_url = '';
        this.url = this.original_url;
        this.params_str = '';
        this.params = {};

        this._get_a_cleaned_url_();
    }

    _get_a_cleaned_url_(){
        if (this.original_url.indexOf('?') != -1){
            this.cleaned_url = this.original_url.slice(0, this.original_url.indexOf('?'));
            this._params_to_properties_();
            this._params_to_url_str_();
        } else {
            this.cleaned_url = this.original_url;
        }
    };

    _params_to_properties_(params){
        params = params === undefined ? params = this.get_url_params(this.original_url) : params
        $.each(params, (key, value)=>{
            this[key] = value;
            this.params[key] = value;
        });
    };

    _params_to_url_str_() {
        let url = this.cleaned_url+'?'
        this.params_str = '';
        let quantity = 0;
        let count = 1;

        $.each(this.params, (ind, value)=>{quantity++});

        if(quantity != 0) {
            $.each(this.params, (key, value)=>{
                if (count < quantity) {
                    this.params_str += `${key}=${value}&`;
                } else {
                    this.params_str += `${key}=${value}`;
                }
                count++;
            })
        }
        this.url = url+this.params_str;
    };

    /**
     * @param {string} url
     * @returns {this} 
     */
    __change_original_url__(url){
        this.original_url = url;
        this.__init__();
        return this;
    };

    /**
     * @param {string} url
     * @returns {dict}
     */
    get_url_params(url) {
        if (url.indexOf('?') == -1) {
            return;
        };

        let params = url.slice(url.indexOf('?')+1, url.length);
        params = params.split('&');
    
        let params_dict = {};
    
        $.each(params, function(ind, param){
            let param_list = param.split('=');
            params_dict[param_list[0]] = param_list[1];
        });
    
        return params_dict;
    };

    /**
     * @param {dict} params
     * @returns {str}
     */
    add_params (params) {
        if (!($.isPlainObject(params) && !$.isArray(params))) {
            throw new Error(`Parameters must be passed by a dictionary, not a ${typeof(params)}`);
        };

        this._params_to_properties_(params);
        this._params_to_url_str_();
        return this.url;
        };
    
    /**
     * @param {list} params 
     * @returns {str}
     */
    delete_params (params) {
        if (!$.isArray(params)) {
            throw new Error(`Parameters must be specified in a list, not a ${typeof(params)}`);
        };

        $.each(params, (ind, param)=>{
            if (!(param in this)){
                throw new Error(`No such parameter exists: ${param}`);
            }
            delete this[param];
            delete this.params[param];
        });

        this._params_to_url_str_();
        return this.url;
    };

    /**
     * @returns {this}
     */
    delete_all_params() {
        $.each(this.params, (key, value)=>{
            delete this[key];
        });
        // this.params = {};
        // this.params_str = '';
        // this.original_url = this.cleaned_url;
        // this.url = this.cleaned_url;
        this.__init__();
        return this;
    }
};

class LoadingAnimation {
    /**
     * @param {dict} props
     * Props dict must contain:
     * 
     * parent_el: jqueryObject
     * 
     * text: str
     */
    constructor(props) {
        this.parent_el = props.parent_el;
        this.text = props.text;
        this.state = '';

        this.original_loader_el = $(`<p>${this.text}</p>`);
        this.loader_el = this.original_loader_el;
    }

    __set_html_loader__() {
        this.parent_el.html(`<br>${this.loader_el.html()}<br>`);
    };

    start_animation() {
        this.state = true;
        this.__set_html_loader__();

        let i = 0;
        const animate = ()=>{
            if (i < 5) {
                setTimeout(()=>{
                    if (this.state) {
                        this.loader_el.text(this.loader_el.text()+'.');
                        this.__set_html_loader__();
                        i++;
                        animate();
                    } else {
                        return;
                    }
                }, 1000);
            }
            else {
                i = 0;
                this.loader_el = $(`<p>${this.text}</p>`);
                this.__set_html_loader__();
                animate();
            }
        };
        animate();
    };

    stop_animation() {
        this.state = false;
    };
};

// ===================================================================================
// Movies filters action functions

let url = '';
let progress_loader = '';

function main_function() {
    pagination_event();
    filters_movies_api_request();
    reset_filters();
};

function movies_api_request() {
    
    progress_loader.start_animation()

    $.ajax({
        url: movies_api_url.url,
        method: 'GET',
        dataType: 'json',
        success: (response)=>{
            
            progress_loader.stop_animation();
            response_to_html(response);
            main_function();
        },
        error: (xhr, status, error)=>{
            console.error(`AJAX error: ${xhr}, ${status}, ${error}`);
            main_function();
        },
    })
}

function filters_movies_api_request() {
    let accept_btn = $('.accept-filters-btn');
    let resest_btn = $('.reset-filters-btn');
    let filters_inputs = $('.movie-filters input');
    
    $.each(filters_inputs, (ind, input)=>{
        $(input).off('input').on('input', ()=>{
            
            let inputs_filled = []

            $.each(filters_inputs, (ind, input)=> {
                if($(input).val() != '') {
                    inputs_filled.push(true)
                }
                else {
                    inputs_filled.push(false)
                }
            });
            
            if (inputs_filled.includes(true)) {
                accept_btn.prop('disabled', false);
                resest_btn.prop('disabled', false);
            }
            else {
                accept_btn.prop('disabled', true);
                resest_btn.prop('disabled', true);
            }
        });
    });

    accept_btn.off('click').on('click', ()=>{
        let params = {}
        
        movies_api_url.delete_all_params();
        
        $.each(filters_inputs, (ind, input)=>{
            if($(input).val() != '') {
                params[$(input).attr('param')] = $(input).val();
            }
        });

        movies_api_url.add_params(params)

        progress_loader.start_animation();

        $.ajax({
            url: movies_api_url.url,
            method: 'GET',
            dataType: 'json',
            success: (response)=>{
                
                progress_loader.stop_animation();
                response_to_html(response);

                if (response.results.length == 0){
                    $('.movies_rows').html('<p><b>Совпадений не найдено<b></p>');
                };

                main_function();
            },
            error: (xhr, status, error)=>{
                console.error(`AJAX error: ${xhr}, ${status}, ${error}`);
                main_function();
            },
        })
    })
}

function reset_filters() {
    let accept_btn = $('.accept-filters-btn');
    let resest_btn = $('.reset-filters-btn');
    let filters_inputs = $('.movie-filters input');

    resest_btn.off('click').on('click', ()=>{

        movies_api_url.delete_all_params();

        $.each(filters_inputs, (ind, input)=>{
            $(input).val('');
            accept_btn.prop('disabled', true);
            resest_btn.prop('disabled', true);
        })

        progress_loader.start_animation();

        $.ajax({
            url: movies_api_url.cleaned_url,
            method: 'GET',
            dataType: 'json',
            success: function(response) {

                progress_loader.stop_animation();
                response_to_html(response);
                main_function();
            },
            error: function(xhr, status, error) {
                console.error('Error: ', xhr, status, error);
                main_function();
            }
        })
    });
};

function response_to_html(response) {
    let tbody = $('.movies_rows');
    tbody.html('');

    $.each(response.results, function(ind, movie){

        let director_html = '';
        $.each(movie.movie_director, (ind, director)=>{
            director_html += `<a href="director-${director.id}">${director.director_name }</a><br>`
        });

        let actor_html = '';
        $.each(movie.movie_actors, (ind, actor)=>{
            actor_html += `<a href="actor-${actor.id}">${actor.actor_name}</a><br>`
        });
        
        let movie_html = `
            <tr class="movie_row">
            <td><a href="movie-${movie.id}">${movie.movie_title }</a></td>
            <td>${movie.movie_date}</td>
            <td>
                ${director_html}
            </td>
            <td>
                ${actor_html}
            </td>
            </tr>`;
        
        tbody.html(tbody.html() + movie_html);
    })
    
    let pagination = $('.step_links');
    let pagination_html = '';

    if(response.page > 1) {
        pagination_html += `
        <a class="paginator-link" page_number="1" href="#">&laquo; первая</a>
        <a class="paginator-link" page_number="${response.page-1 }" href="#">предыдущая</a>`;
    }
    pagination_html += `
    <span class="current">
        Страница ${response.page} из ${response.last_page}.
    </span>`;

    if (response.page != response.last_page) {
        pagination_html += `
        <a class="paginator-link" page_number="${response.page+1}" href="#">следующая</a>
        <a class="paginator-link" page_number="${response.last_page}" href="#">последняя &raquo;</a>`;
    }

    pagination_html += `
    <span class="page_number" page_number="${response.page}" style="display: none;"></span>`;

    pagination.html(pagination_html);
};

function pagination_event() {

    let paginator_link = $('.paginator-link');

    $.each(paginator_link, (ind, link)=>{

        let page = $(link).attr('page_number');

        $(link).on('click', (e)=>{
            e.preventDefault();

            movies_api_url.add_params({'page': page});

            progress_loader.start_animation();

            $.ajax({
                url: movies_api_url.url,
                method: 'GET',
                dataType: 'json',
                success: function(response) {
                    
                    progress_loader.stop_animation();
                    response_to_html(response);
                    main_function();
                },
                error: function(xhr, status, error) {
                    console.error(`Error: ${xhr}, ${status}, ${error}`);
                    main_function();
                },
            });
        });
    });
};