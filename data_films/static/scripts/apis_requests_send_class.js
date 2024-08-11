class ObjectToHTML {
    constructor() {
        this.html = document.getElementsByTagName('html')[0].innerHTML;
        this.new_html = this.html;

        this.tags_list = {};
        this.processed_function_tags = [];

        this.some_list = [];
        this.invalid_functions_tags = [];

        this.html_cleaning();
    }

    /**
     * @param {string} tag_type
     * @param {string|null} source_html
     * @returns {list}
     * @ This method accepts the type of the tag being searched for (variable or function) and 
     * searches for tags of the form [[ some_variable ]] and [% some_function %] in the HTML code of the page.
     * @ Also, when searching for internal tags, it takes as a parameter the internal HTML code of the function tag, 
     * in which it performs the search, outside the main HTML code of the page.
     * @ Returns an array containing the found tags as objects.
     */
    get_html_tags_list(tag_type, source_html=null) {
        let self = this;
        let last_processed_tag_index = 0;
        let opening_tag_character;
        let closing_tag_character;
        let __tags_list__ = [];

        if (tag_type == '[['){
            opening_tag_character = '[[';   closing_tag_character = ']]';
        } else if (tag_type == '[%'){
            opening_tag_character = '[%';   closing_tag_character = '%]';
        }

        if (source_html == null){
            source_html = this.html;
        }

        function recursion() {
            let beginning_tag_index = source_html.indexOf(opening_tag_character, last_processed_tag_index+1);
            let ending_tag_index = source_html.indexOf(closing_tag_character, last_processed_tag_index+1);
                        
            if (beginning_tag_index != -1 && ending_tag_index != -1){
                let tag_element = source_html.slice(beginning_tag_index, ending_tag_index+2);
                let tag_header_text = source_html.slice(beginning_tag_index+2, ending_tag_index);

                tag_header_text = tag_header_text.replace(/^\s*/, '').replace(/\s*$/, '');

                __tags_list__.push({beginning_tag_index, ending_tag_index, tag_element, tag_header_text});

                last_processed_tag_index = ending_tag_index;

                recursion();
            }
        }
        recursion();

        return __tags_list__;
    }

    /**
     * @param {list} __tags_list__
     * @returns {list}
     * @ This method takes an array of tags, unwraps it, and calls the content collection method for each tag.
     * @ It also filters external tags in the global html from internal tags related to function tags.
     * @ Returns an array of tags with the collected content.
     */
    get_tag_content(__tags_list__){

        for (let i=0; i < __tags_list__.length; i++) {

            let tag = __tags_list__[i];
            tag['tag_header_text'] = tag.tag_header_text.split('.');
            tag['content'] = this.get_html_tag_content(tag.tag_header_text);

            if (tag['content'] === undefined) {
                // this.some_list.push(tag);
                __tags_list__.splice(i, 1);
                i--;
            }
        }
        return __tags_list__;
    }

    /**
     * @param {dict} tag
     * @returns {list}
     * @ This method is used to get the internal code of a function tag block.
     * @ As a parameter, it takes a tag object containing information such as the index of the beginning of the block in the source html code, the index of the end of the tag declaring the function block, the name of the variable and the name of the source object.
     * @ Returns an array containing the full code of the function tag block, inner text that does not contain the text of specific tags, and RegExp objects containing the declaring and closing tags of the function block.
     */
    get_function_tag_code(tag){
        try{
            let tag_header_list = tag.tag_header_text.split(' ');
            tag['function_type'] = tag_header_list[0];

            tag['tag_header_dict'] = {
                                    'function_type': tag_header_list[0],
                                    'variable': tag_header_list[1],
                                    'operator': tag_header_list[2],
                                    'iterable_variable': tag_header_list[3]
                                    }

            if (tag_header_list.length <= 1){
                return;
            }

            let substring_search = this.html.slice(tag.beginning_tag_index, this.html.length);

            let regexp_open_tag = new RegExp(`\\[%\\s*${tag.tag_header_text}\\s*%\\]`);
            let regexp_close_tag = new RegExp(`\\[%\\s*end${tag.function_type}\\s*%\\]`);
            
            tag['match_open_tag'] = regexp_open_tag.exec(substring_search);
            tag['match_close_tag'] = regexp_close_tag.exec(substring_search);
            
            if (tag.match_close_tag === null){
                throw new Error(`No closing tag found for ${tag.tag_element}. Did you forget to use the [% end${tag.function_type} %]?`);
            }

            tag['full_html'] = substring_search.slice(tag.match_open_tag.index, tag.match_close_tag.index + tag.match_close_tag[0].length);
            tag['internal_html'] = tag.full_html.slice(tag.match_open_tag.index + tag.match_open_tag[0].length, tag.match_close_tag.index);
        } catch (error) {
            tag.content = '';
            this.invalid_functions_tags.push(tag);
            console.error(error);
            return tag;
        } finally {
            return tag;
        }
    }

    /**
     * @param {string} tag_header_text 
     * @returns {string}
     * @ This method takes as a parameter a string that is a representation of an object in code, for example:
     * @ some_variable.some_propertie
     * @ Collects information from an object that was received from the server API and is located in the global area 
     * @ of ​​the JS code in the form of a variable identical to the text representation of the object.
     * @ Returns information as a string, or as an array if the iterable object contains the desired property
     */
    get_html_tag_content(tag_header_text){
        let tag_content;

        if (tag_header_text.length > 0 && tag_header_text[0] in window){           
            
            $.each(tag_header_text, (ind, variable)=>{

                if (ind == 0){
                    tag_content = window[`${variable}`].object;
                } else {
                    function array_recursion(tag_content_object_recursion){
                        if (!Array.isArray(tag_content_object_recursion)){
                            tag_content_object_recursion = tag_content_object_recursion[variable];
                        } else {
                            if (tag_content_object_recursion.length == 1){
                                tag_content_object_recursion = tag_content_object_recursion[0][variable];
                            } else {
                                let related_objects_content_list = [];
                                $.each(tag_content_object_recursion, (ind, related_object)=>{
                                    related_objects_content_list.push(related_object[variable]);
                                });
                                return related_objects_content_list;
                            }
                        }
                        return tag_content_object_recursion;
                    }
                    tag_content = array_recursion(tag_content);
                }
            });

            if (tag_content === undefined){
                tag_content = '';
            }
            return tag_content;
        }
    }

    /**
     * @param {object} tag 
     * @returns {object}
     */
    standard_functions(tag){
        if (tag.function_type = 'for'){
            if (tag.tag_header_dict.operator != 'in'){
                throw new Error(`Unexpected operator's value. ${tag.tag_element} recieved "${tag.tag_header_dict.operator}" instead of "in"`)
            } else {
                return this.processing_for_function(tag);
            }
        } else if (tag.function_type = 'if'){
            // pass
        } else {
            throw new Error('Unsuported function type: ', tag.function_type)
        }
    }

    /**
     * @param {object} tag 
     * @returns {object}
     */
    processing_for_function(tag){
        tag['full_html_with_content'] = '';
        tag['content'] = '';
        tag['inner_variables'];
        
        try{
            let internal_tags_list = this.get_html_tags_list('[[', tag.internal_html);
            let internal_tags_dict = {};
            tag.tag_header_dict.iterable_variable_content = this.get_html_tag_content(tag.tag_header_dict.iterable_variable.split('.'));

            if(!Array.isArray(tag.tag_header_dict.iterable_variable_content)){
                tag.content = '';
                throw new Error(`${tag.tag_header_dict.iterable_variable} is not iterable variable`);
            }

            // Идёт проверка каждого тега внутри html функции на соответствие переменной в заголовке тега
            for (let i=0; i < internal_tags_list.length; i++){

                let internal_tag = internal_tags_list[i];
                let regex_variable = new RegExp(`^${tag.tag_header_dict.variable}(\\.|$)`);

                if (regex_variable.exec(internal_tag.tag_header_text)) {
                    let original_iterable_tag = internal_tag.tag_header_text.replace(regex_variable, tag.tag_header_dict.iterable_variable+'.');
                    
                    if (original_iterable_tag.lastIndexOf('.') == original_iterable_tag.length-1){
                        original_iterable_tag = original_iterable_tag.slice(0, original_iterable_tag.length-1)
                    }

                    let tag_content = this.get_html_tag_content(original_iterable_tag.split('.'));

                    if(!Array.isArray(tag_content)){
                        tag_content = [tag_content]
                    }

                    internal_tags_dict[i] = tag_content;
                }
            }

            for (let i=0; i < tag.tag_header_dict.iterable_variable_content.length; i++){

                let html_block_content = tag.internal_html;
                
                $.each(internal_tags_dict, (ind, related_object_content)=>{
                    html_block_content = html_block_content.replace(internal_tags_list[ind].tag_element, related_object_content[i]);
                });

                tag.content += html_block_content;
                tag.full_html_with_content = tag.match_open_tag[0] + tag.content + tag.match_close_tag[0];
                
                tag.inner_variables = internal_tags_dict;
            }
        } catch (error) {
            console.error(`Unexpected error with tag object: ${tag.tag_element}`, tag);
            console.error(error);
            tag.content = '';
        } finally {
            return tag;
        }
    }

    /**
     * @param {list} tags_list 
     * @param {string} tag_type
     */
    content_to_html(tags_list, tag_type){
        let self = this;
        if(tag_type == 'variable'){
            $.each(tags_list, (ind, tag)=>{
                this.new_html = this.new_html.replace(tag.tag_element, tag.content);
            });
        } else if (tag_type == 'function'){
            $.each(tags_list, (ind, tag)=>{
                this.new_html = this.new_html.replace(tag.full_html, tag.content);
            });
        }

        document.getElementsByTagName('html')[0].innerHTML = this.new_html;
    }

    cleaning_invalid_tags(){
        let self = this;
        let reg = /\[\[\s*.*?\s*\]\]/g;
        let match = this.new_html.match(reg);

        if (Array.isArray(match)){
            $.each(match, (ind, tag)=>{
                this.new_html = self.new_html.replace(tag, '')
            });
        }

        document.getElementsByTagName('html')[0].innerHTML = self.new_html;
    }

    /**
     * @ A method that starts the process of processing variable tags and function tags, and substituting objects that correspond to them.
     * @ The launch is carried out by running the:
     * @ get_html_tags_variable() 
     * @ and 
     * @ get_html_tags_function() 
     * @ methods.
     */
    async tag_processing(){
        this.new_html = this.html;
        await this.get_html_tags_variable();
        await this.get_html_tags_function();
        this.cleaning_invalid_tags();
    }

    async get_html_tags_variable(){
        let self = this;
        return new Promise((resolve, reject)=>{
            let last_processed_tag_index = 0;
            let tag_type = '[['; 
    
            let __tags_list__ = this.get_html_tags_list(tag_type);

            let tags_content_list = this.get_tag_content(__tags_list__);
            this.tags_list['variables'] = tags_content_list;
            this.content_to_html(tags_content_list, 'variable');
            resolve();
        });
    }
    
    async get_html_tags_function() {
        let self = this;
        return new Promise((resolve, reject)=>{
            try {
                let length_correction = 0;
                let tag_type = '[%';
                let __tags_list__ = this.get_html_tags_list(tag_type);

                $.each(__tags_list__, (ind, tag)=>{
                    try {
                        if (tag.tag_header_text.indexOf(' ') != -1){
                            tag = this.get_function_tag_code(tag);
                            //Здесь вставить функцию выбора типа функции
                            tag = this.standard_functions(tag)
                            this.processed_function_tags.push(tag);
                        }
                    } catch (error) {
                        console.error(error)
                    } finally {
                        this.content_to_html(this.processed_function_tags, 'function');
                        this.tags_list['functions'] = this.processed_function_tags;
                    }
                });
            } catch (error) {
                console.error(error);
            } finally {
                resolve();
            }
        })
    }

    html_cleaning(){
        let variables_tags = this.get_html_tags_list('\[\[');
        let functions_tags = this.get_html_tags_list('[%');
        
        try {
            for (let i=0; i<functions_tags.length; i++){
                let tag = functions_tags[i];
                let tag_code = this.get_function_tag_code(tag);
    
                if (tag_code == undefined){
                    functions_tags.splice(i, 1);
                    i--;
                    continue;
                }
                
                tag['content'] = '';
            }
    
            for (let i=0; i<variables_tags.length; i++){
                variables_tags[i]['content'] = '';
            }
        } catch (error) {
            console.error(error);
        } finally {
            this.content_to_html(functions_tags, 'function');
            this.content_to_html(variables_tags, 'variable');
        }
    }
}

class DetailViewApiRequest {
    constructor(props){
        this.api_url = props.api_url;

        this.success = props.success;

        this.object;

        this.html = document.getElementsByTagName('html')[0].innerHTML;
        this.custom_tags = new ObjectToHTML();
        
        this.get_object();
    }
    
    async get_object() {
        let self = this;

        return new Promise((resolve, reject)=>{
            $.ajax({
                url: self.api_url,
                method: 'GET',
                dataType: 'json',
                async: true,
                success: (response)=>{
                    self.object = response;
                    self.custom_tags.tag_processing();
                    self.success();
                    resolve();
                },
                error: (xhr, error, status)=>{
                    console.error(`XHR: ${xhr}, Error: ${error}, Status: ${status}`)
                    reject();
                }
            })
        })
    }
}

class UpdateViewApiRequest extends DetailViewApiRequest {
    constructor(props){
        super(props);
    }
}

class RelatedFieldAPIRequest {
    /**
     * @param {dict} props
     * @param {list} props.related_api_urls list
     */
    constructor(props){
        this.related_api_urls = props.related_api_urls;
        this.form = props.form;

        this.method = props.method;

        this.post_api_url = props.post_api_url;
        this.update_api_url = props.update_api_url;

        this.response_data = {};

        this.option_tag = props.option_tag;
        this.success_request = props.success_request;

        this.__get_related_fields_data__();
        this.__send_post_api__();
    };

    /** 
     * @param {str} api_url
     * @param {str} data_key
     */
    async __get_object_list__(data_key, api_url){
        let self = this;

        return new Promise((resolve, reject)=>{
            $.ajax({
                url: api_url,
                method: 'GET',
                dataType: 'json',
                success: function(response){
                    self.response_data[data_key] = response;
                    resolve();
                },
                error: function(xhr, status, error){
                    console.error(`XHR: ${xhr}, status: ${status}, Error: ${error}`)
                    reject();
                },
            });
        })
    };

    async __get_related_fields_data__(){
        if (Object.prototype.toString.call(this.related_api_urls) === '[object Object]'){
            for (let field in this.related_api_urls){
                let url = this.related_api_urls[field];
                await this.__get_object_list__(field, url);
            }
            this.__fill_form_related_fields__();
            return this.response_data;
        } else {
            throw new Error(`${this.constructor.name}.related_api_urls must contain dict, not "${this.related_api_urls}"`);
        };
    };

    __fill_form_related_fields__(){

        let html_string = '';

        $.each(this.response_data, (field, value)=>{
            
            let rel_field = this.form.find(`[name=${field}]`);
            rel_field.html('');
            
            html_string = '';
            
            $.each(value, (ind, obj)=>{
                html_string += this.option_tag(obj)[field];
            });

            rel_field.html(html_string);
        });
    };

    __send_post_api__(){
        
        let self = this;

        this.form.on('submit', function (e){
            e.preventDefault();
    
            let form_data = {};
            let inputs = self.form.find('input');
            let selects = self.form.find('select');
    
            $.each(inputs, (ind, input)=>{
                form_data[input.name] = input.value;
            });
    
            $.each(selects, (ind, select)=>{
    
                let selected_optns = [];
    
                $.each(select.selectedOptions, (ind, selected_option)=>{
                    let select_dict = {};
                    select_dict['id'] = selected_option.value;
                    select_dict[selected_option.getAttribute('name')] = selected_option.innerText;
                    selected_optns.push(select_dict);
                });
    
                form_data[select.name] = selected_optns;
            });
    
            form_data = JSON.stringify(form_data);

            $.ajax({
                url: self.post_api_url,
                method: self.method,
                contentType: 'application/json',
                data: form_data,
                success: function(response){
                    self.success_request(response);
                },
                error: (xhr, status, error)=>{
                    console.error(`AJAX error: ${xhr}, ${status}, ${error}`);
                },
            })
        })
    }
};