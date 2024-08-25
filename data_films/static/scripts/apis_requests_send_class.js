class Tag {
    constructor(){
        this.type = '';
        this.symbol = '';

        this.beginning_tag_index = 0;
        this.ending_tag_index = 0;

        this.element = '';
        this.element_text = '';

        this.header = {list: []};
    }

    get_properties(tag_object){
        let object = tag_object;
        let new_object = this;

        function recursion(object, new_object){

            $.each(object, (key, propertie)=>{
                if(Object.prototype.toString.call(propertie) === '[object Object]'){
                    new_object[key] = recursion(propertie, new_object[key])
                } else {
                    new_object[key] = propertie;
                }
            });
            return new_object;
        }
        recursion(object, new_object);
        return new_object;
    }
}

class CustomTag extends Tag{
    constructor(...props){
        super(...props)
        
        this.tags_list = {};
        this.processed_function_tags = [];
        this.invalid_functions_tags = [];

        this.new_html = this.html;
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
    get_html_tags_list(tag_type, parent_tag=null, cleaning=null) {
        let self = this;
        let source_html;
        let last_tag_index = 0;
        let opening_tag_symbol;
        let closing_tag_symbol;
        let index_number = 0;
        let __tags_list__ = [];
        
        if (tag_type == 'variable' || tag_type == 'inner_variable'){
            opening_tag_symbol = '[[';   closing_tag_symbol = ']]';
        } else if (tag_type == 'function'){
            opening_tag_symbol = '[%';   closing_tag_symbol = '%]';
        }

        if (parent_tag == null){
            source_html = this.html;
        } else {
            source_html = parent_tag.internal_html.original;
        }

        // console.log(source_html)

        function recursion() {
            let tag = new CustomTag();
            
            tag.html = self.html;
            tag.type = tag_type;
            tag.symbol = opening_tag_symbol;
            tag.index_number = index_number;

            tag.beginning_tag_index = source_html.indexOf(opening_tag_symbol, last_tag_index+1);
            tag.ending_tag_index = source_html.indexOf(closing_tag_symbol, last_tag_index+1);
            
            last_tag_index = tag.ending_tag_index;
                
            if (tag.beginning_tag_index != -1 && tag.ending_tag_index != -1){
                tag.element = source_html.slice(tag.beginning_tag_index, tag.ending_tag_index+2);
                tag.element_text = source_html.slice(tag.beginning_tag_index+2, tag.ending_tag_index);

                tag.element_text = tag.element_text.replace(/^\s*/, '').replace(/\s*$/, '');
                
                if (tag.type == 'variable' || tag.type == 'inner_variable'){
                    tag.header.list = tag.element_text.split('.');
                } else if (tag.type == 'function') {
                    tag.header.list = tag.element_text.split(' ');
                }
                
                tag.ending_tag_index = tag.ending_tag_index + 2;
                
                if (!self.variable_is_global(tag) && tag.type == 'variable'){
                    return recursion();
                } else if (parent_tag != null) {
                    
                    if (tag.header.list[0] != parent_tag.header.dict.variable){
                        return recursion();
                    }
                }

                tag = self.tag_identification(tag);

                index_number++;

                __tags_list__.push(tag);

                recursion();
            }
        }
        recursion();
        // console.log(__tags_list__)
        return __tags_list__;
    }

    tag_identification(tag){
        if (tag.type == 'variable' || tag.type == 'inner_variable'){
            return new VariableTag().get_properties(tag);
        } else if (tag.type == 'function' && tag.header.list.length > 1){
            console.log('11', tag)
            console.log('22', new FunctionOpenTag().get_properties(tag))
            return new FunctionOpenTag().get_properties(tag);
        } else if (tag.type == 'function' && FunctionEndTag.check_for_endtag(tag)){
            return new FunctionEndTag().get_properties(tag);
        } else if (tag.type == 'function' && FunctionElseTag.check_else_tag(tag)){
            return new FunctionElseTag().get_properties(tag);
        }
        console.warn(tag);
        throw new Error(`Failed to set tag type or syntax is invalid: ${tag.element}`);
    }

    variable_is_global(tag){
        if (tag.header.list[0] in window){
            return true;
        } else {
            return false;
        }
    }
    /**
     * @param {string} variable
     * @returns {list} 
     */
    variable_to_list(variable){
        if (typeof(variable) == 'string'){
            if(variable.indexOf('.') != -1){
                return variable.split('.');
            } else {
                return [variable];
            }
        } else {
            throw new Error(`The "variable" parameter must be a string, not an ${typeof(variable)}.`);
        }
    }

    /**
     * @param {object} tag
     * @returns {string} tag_content
     * @ This method takes as a parameter a string that is a representation of an object in code, for example:
     * @ some_variable.some_propertie
     * @ Collects information from an object that was received from the server API and is located in the global area 
     * @ of ​​the JS code in the form of a variable identical to the text representation of the object.
     * @ Returns information as a string, or as an array if the iterable object contains the desired property
     */
    get_tag_content(variable_header_list, search_scope=null){
        let tag_content;

        if (search_scope == null){
            search_scope = window;
        }

        if (variable_header_list.length > 0 && variable_header_list[0] in search_scope){           
            
            $.each(variable_header_list, (ind, propertie)=>{
                if (ind == 0){
                    tag_content = search_scope[propertie];
                } else {
                    tag_content = tag_content[propertie];
                }
            });

            if (tag_content === undefined){
                tag_content = '';
            }

            return tag_content;
        } else {
            throw new Error(`Could not find variable ${variable_header_list[0]} in search scope ${search_scope}.`);
        }
    }

    content_to_html(tags_list, tag_type){
        let self = this;
        if(tag_type == 'variable'){
            $.each(tags_list, (ind, tag)=>{
                this.new_html = this.new_html.replaceAll(tag.element, tag.content);
            });
        } else if (tag_type == 'function'){
            console.log('Function tags list', tags_list)
            $.each(tags_list, (ind, tag)=>{
                if (!tag.is_child){
                    // console.log(this.new_html.indexOf(tag.full_original_html))
                    this.new_html = this.new_html.replaceAll(tag.full_original_html, tag.content.full);
                } else {
                    // console.log(`tag to html: `,tag)
                }
            });
        }
    }
}

class VariableTag extends CustomTag {
    constructor(...props){
        super(...props);

        this.content = '';
    }
}

class FunctionTag extends CustomTag {
    constructor(...props){
        super(...props);

        this.function_type = '';
        this.tag_type = '';

        this.index_number = 0;
    }
}

class FunctionOpenTag extends FunctionTag {
    constructor(...props){
        super(...props);

        this.content = {full: '',
                        list: [],
                        html_list: []
                        };

        this.header = {...super.header,
                        dict: {function_type: '',
                            }
                        }

        this.full_original_html = '';
        
        this.is_opentag = true;
        this.endtag = [];

        this.internal_html = {original: '',
                            with_content_list: [],
                            with_childs_content_list: []
                            };

        this.internal_variables_list = [];

        this.is_parent = false;
        this.is_child = false;

        this.child_tags = [];
        this.parent_tag = [];
    }
}

class FunctionForTag extends FunctionOpenTag {
    constructor(...props){
        super(...props)

        this.header = {...super.header,
            dict: {function_type: '',
                variable: '',
                operator: '',
                iterable_variable: '',
                iterable_variable_list: []
                }
            }
    }

    /**
     * @param {object} tag 
     * @returns {object}
     */
    processing_for_function(tag){
        tag = this.get_internal_tag_markup(tag);

        if (tag.header.dict.operator == 'in'){
            tag = this.get_internal_variables(tag);
            tag = this.get_content_list(tag);
            tag = this.content_to_html_list(tag);
        } else {
            throw new Error(`Unexpected operator's value. ${tag.element} recieved "${tag.header.dict.operator}" instead of "in"`)
        }
        return tag;
    }

    get_internal_tag_markup(tag){
        tag.header.dict.variable = tag.header.list[1];
        tag.header.dict.operator = tag.header.list[2];
        tag.header.dict.iterable_variable = tag.header.list[3];
        tag.header.dict.iterable_variable_list = tag.header.list[3].split('.');

        return tag;
    }

    get_internal_variables(tag){
        // console.log(tag)
        tag.internal_variables_list = this.get_html_tags_list('inner_variable', tag);
        return tag;
    }

    get_content_list(tag){
        if(!tag.is_child){
            tag.content.list = this.get_tag_content(tag.header.dict.iterable_variable_list);
        } else if (tag.is_child) {
            tag.parent_tag[0].content.list.forEach((parent_object)=>{
                tag.content.list.push(this.get_tag_content([tag.header.dict.iterable_variable_list[1]], parent_object));
            });
        }
        return tag;
    }

    content_to_html_list(tag){
        let self = this;
        let content_list = tag.content.list.map((object)=>{return object});
        function object_to_html(object){
            let html_with_content = tag.internal_html.original;

            $.each(tag.internal_variables_list, (i, internal_variable)=>{
                let content = self.get_tag_content([internal_variable.header.list[1]], object)
                html_with_content = html_with_content.replaceAll(internal_variable.element, content)
            })

            return html_with_content;
        }

        let recursion_on;
        function recursion(content_list){
            let html_with_content = '';
            
            $.each(content_list, (ind, object)=>{
                if(Array.isArray(object)){
                    recursion_on = true;
                    recursion(object);
                } else {
                    if (recursion_on){
                        html_with_content += object_to_html(object);
                    } else {
                        tag.internal_html.with_content_list.push(object_to_html(object));
                    }
                }
            })

            if (recursion_on){
                tag.internal_html.with_content_list.push(html_with_content);
            }
            recursion_on = false
        }
        recursion(content_list);
        return tag;
    }
}

class FunctionIfTag extends FunctionOpenTag {
    constructor(...props){
        super(...props)

        this.operators = ['==', '!=', 'in']

        this.header = {...super.header,
                        dict: {function_type: '',
                            variable_1: '',
                            variable_2: '',
                            iterable_variable: '',
                            iterable_variable_list: []
                            }
                        }

        this.is_else = false;
        this.elsetag = null;

        this.true_module = '';
        this.else_module = '';
    }

    /**
     * @param {object} tag 
     * @returns {object}
     */
    processing_if_function(tag){
        tag = this.get_internal_tag_markup(tag);
        tag = this.condition_check(tag);
        console.log('If tag: ', tag)
        return tag;
    }

    get_internal_tag_markup(tag){
        tag.header.dict.variable_1 = tag.header.list[1];
        tag.header.dict.variable_1_list = this.variable_to_list(tag.header.dict.variable_1);

        if (tag.header.dict.variable_1_list[0] in window){
            tag.header.dict.variable_1_value = this.get_tag_content(tag.header.dict.variable_1_list);
        } else if (tag.header.dict.variable_1_list[0] == 'null' || tag.header.dict.variable_1_list[0] == 'undefined'){
            tag.header.dict.variable_1_value = `${tag.header.dict.variable_1_list[0]}`;
        }

        if (tag.header.list.length > 2){
            tag.header.dict.operator = tag.header.list[2];
            tag.header.dict.variable_2 = tag.header.list[3];
            tag.header.dict.variable_2_list = this.variable_to_list(tag.header.dict.variable_2);

            this.operator_is_valid(tag.header.dict.operator);

            if (tag.header.dict.variable_2_list[0] in window){
                tag.header.dict.variable_2_value = this.get_tag_content(tag.header.dict.variable_2_list);
            } else if (tag.header.dict.variable_2_list[0] == 'null' || tag.header.dict.variable_2_list[0] == 'undefined'){
                tag.header.dict.variable_2_value = `${tag.header.dict.variable_2_list[0]}`;
            }
        }

        // if (tag.is_child){

        //     if(tag.parent_tag[0].function_type== 'for'){

        //         if (tag.header.dict.variable_1_list[0] == tag.parent_tag[0].header.dict.variable){
        //             console.log('There is a match for variable 1')
        //             console.log(tag.get_tag_content([tag.parent_tag[0].header.dict.variable], tag.parent_tag[0].content.list))
        //         }

        //         if (tag.header.dict.variable_2_list[0] == tag.parent_tag[0].header.dict.variable){
        //             console.log('There is a match for variable 2')
        //             console.log(tag.get_tag_content([tag.parent_tag[0].header.dict.variable], tag.parent_tag[0].content.list[0]))
        //         }

        //     }
        // }

        return tag;
    }

    /**
     * @param {*} operator 
     */
    operator_is_valid(operator){
        if(this.operators.includes(operator)){
            return true;
        } else {
            throw new Error(`Operator is invalid. Expected "==" or "!=" or "in", but got "${operator}"`);
        }
    }

    get_else_module(tag){
        let elsetag = new RegExp(`\\[%\\s*else\\s*%\\]`)
    }

    condition_check(tag){
        if (tag.header.dict.variable_2 != 'undefined' || tag.header.dict.variable_2 != 'null'){

            switch (tag.header.dict.operator){
                case '==':
                    if(`${tag.header.dict.variable_1_value}` == `${tag.header.dict.variable_2_value}`){
                        return this.condition_true(tag);
                    } else {
                        return this.condtition_false(tag);
                    }
                case '!=':
                    if(`${tag.header.dict.variable_1_value}` != `${tag.header.dict.variable_2_value}`){
                        return this.condition_true(tag);
                    } else {
                        return this.condtition_false(tag);
                    }
            }
        } else {
            // pass
        }
    }

    condition_true(tag){
        console.log('condition_is_true');
        if (tag.elsetag){
            tag.true_module = this.html.slice(tag.ending_tag_index, tag.elsetag[0].beginning_tag_index);
            console.log(tag.true_module)
            tag.content.full = tag.true_module;
        } else {
            tag.content.full = tag.internal_html.original;
        }
        return tag;
    }

    condtition_false(tag){
        console.log('condition_is_false');
        if (tag.elsetag){
            tag.false_module = this.html.slice(tag.elsetag[0].ending_tag_index, tag.endtag[0].beginning_tag_index);
            console.log(tag.false_module)
            tag.content.full = tag.false_module;
        }
        return tag;
    }
}

class FunctionElseTag extends FunctionTag {
    constructor(...props){
        super(...props);

        this.is_else = true;
        this.if_tag = [];
    }

    static check_else_tag(tag){
        return new RegExp(`\\[%\\s*else\\s*%\\]`).test(tag.element);
    }
}

class FunctionEndTag extends FunctionTag {
    constructor(...props){
        super(...props);
        
        this.is_endtag = true;
        this.opentag = [];
    }

    static check_for_endtag(tag){
        return new RegExp(`\\[%\\s*end[a-z]+\\s*%\\]`).test(tag.element);
    }
}

class CustomVariableTag extends CustomTag{
    constructor(...props){
        super(...props);
    }

    async get_html_tags_variable(){
        let self = this;
        return new Promise((resolve, reject)=>{
            let tags_list = this.get_html_tags_list('variable');
    
            $.each(tags_list, (ind, tag)=>{
                try{
                    tag['content'] = this.get_tag_content(tag.header.list);
                } catch (error) {
                    console.error(error);
                }
            })

            this.tags_list['variables'] = tags_list;
            this.content_to_html(tags_list, 'variable');
            resolve();
        });
    }
}

class CustomFunctionTag extends CustomVariableTag{
    constructor(...props){
        super(...props)
    }

    async get_html_tags_function(){
        let self = this;
        return new Promise((resolve, reject)=>{
            try {
                let tags_list = this.get_html_tags_list('function');
                let tags_list_copy = [];
                console.log('11111', tags_list);
                tags_list.forEach((tag, ind)=>{
                    if(tag.is_opentag){
                        tag = this.standard_functions(tag);
                        // console.log('2222', tag);
                        tags_list[ind] = tag;
                        // tags_list_copy.push(tag);
                    }
                })

                // tags_list = tags_list_copy;
                // tags_list_copy = [];
                tags_list = this.set_tag_dependencies(tags_list);
                console.log('3333', tags_list)

                tags_list.forEach((tag)=>{
                    // console.log('aaaaaa', tag)
                    if (tag.is_opentag){
                        tag = this.get_function_tag_code(tag);
                        tag = this.processing_function(tag);
                        console.log('123123', tag)
                        // tag = this.standard_functions(tag);
                        tags_list_copy.push(tag);
                    }
                })

                tags_list = tags_list_copy;
                tags_list = this.child_content_to_parent(tags_list);
                this.content_to_html(tags_list, 'function');

                this.tags_list['functions'] = this.processed_function_tags;
            } catch (error) {
                console.error(error);
            } finally {
                resolve();
            }
        })
    }

    set_tag_dependencies(tags_list){
        for (let ind=0; ind < tags_list.length; ind++){
            let tag = tags_list[ind];
            let open_tags_count = 0;
            let close_tags_count = 0;
            
            if (tag.is_opentag){
                open_tags_count++;

                let i = ind;
                function recursion(){

                    if (open_tags_count != close_tags_count && tags_list[i+1] === undefined){
                        throw new Error(`No closing tag found for ${tag.element}. Did you forget to put the [% end${tag.function_type} %] closing tag?`)
                    }

                    if (tag.is_else){
                        i++;
                        return recursion();
                    }

                    if (tags_list[i+1].is_endtag){

                        close_tags_count++;
                        if (open_tags_count == close_tags_count){
                            tag.endtag[0] = tags_list[i+1];
                            tags_list[i+1].opentag[0] = tag;
                            
                            return;
                        } else {
                            i++;
                            return recursion();
                        }
                    } else if (tags_list[i+1].is_opentag){
                        tag.is_parent = true;
                        tag.child_tags.push(tags_list[i+1]);
                        
                        tags_list[i+1].is_child = true;
                        tags_list[i+1].parent_tag[0] = tag;
                        
                        i++;
                        open_tags_count++;
                        return recursion();
                    }
                    i++;
                    return recursion();
                }
                recursion();
            } else if (tag.is_endtag){
                close_tags_count++;
            } else if (tag.is_else){
                tag.if_tag = [tags_list[ind-1]];
                tag.if_tag[0].elsetag = [tag];
            } else {
                console.warn(tag);
                throw new Error(`Unknown tag type`)
            }
        }
        return tags_list;
    }

    get_function_tag_code(tag, source_html=null){
        let self = this;

        try{
            if (!tag.is_opentag){
                return;
            }

            let html = this.html;
            if(source_html != null){
                html = source_html;
            }
            
            tag.full_original_html = this.html.slice(tag.beginning_tag_index, tag.endtag[0].ending_tag_index);
            tag.internal_html.original = this.html.slice(tag.ending_tag_index, tag.endtag[0].beginning_tag_index);

            if (tag.endtag[0] === null){
                throw new Error(`No closing tag found for ${tag.tag_element}. Did you forget to use the [% end${tag.function_type} %]?`);
            }

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
     * @param {object} tag 
     * @returns {object}
     */
    standard_functions(tag){
        tag.header.dict.function_type = tag.header.list[0];
        tag.function_type = tag.header.list[0];

        if (tag.function_type == 'for'){
            tag = new FunctionForTag().get_properties(tag);
        } else if (tag.function_type == 'if'){
            tag = new FunctionIfTag().get_properties(tag);
        } else {
            console.warn(tag);
            throw new Error('Unsuported function type: ', tag.function_type)
        }
        // console.log('66', tag.content)
        return tag;
    }

    processing_function(tag){
        if (tag.function_type == 'for'){
            console.log(tag)
            tag = tag.processing_for_function(tag);
        } else if (tag.function_type == 'if'){
            tag = tag.processing_if_function(tag);
        } else {
            console.warn(tag);
            throw new Error('Unsuported function type: ', tag.function_type)
        }
        // console.log('66', tag.content)
        return tag;
    }

    child_content_to_parent(tags_list){

        function recursion(tags_list){

            $.each(tags_list, (index, tag)=>{

                if(tag.is_parent){

                    $.each(tag.child_tags, (ind, child_tag)=>{

                        if(child_tag.is_parent){
                            recursion(child_tag.child_tags);
                        }

                    })

                    $.each(tag.internal_html.with_content_list, (i, parent_html)=>{

                        $.each(tag.child_tags, (j, child_tag)=>{
                            parent_html = parent_html.replace(child_tag.full_original_html, child_tag.internal_html.with_content_list[i]);
                        })
                        tag.content.full += parent_html;
                    })
                }
            });
        }
        recursion(tags_list);
        return tags_list;
    }

    // list_content_to_string(list_content){
    //     if(Array.isArray(list_content)){
    //         let string_content = '';
    //         $.each(list_content, (ind, content)=>{
    //             string_content += content;
    //         })
    //         return string_content;
    //     } else {
    //         return list_content;
    //     }
    // }

    // variable_and_content_to_dict(internal_variable_list, object){
    //     let objects_list = {};

    //     $.each(internal_variable_list, (ind, internal_variable)=>{
    //         objects_list[internal_variable.element] = object[ind];
    //     })
    //     return objects_list;
    // }

    // get_content_from_objects_list(objects_list, tag){
    //     let test_list = [];
    //     $.each(objects_list, (ind, object)=>{
    //         let variable_object_dict = this.variable_and_content_to_dict(tag.internal_tags_list, object)
    //         let tag_content = this.variable_to_internal_html(variable_object_dict, tag.internal_html)

    //         test_list.push(tag_content)
    //     })
    //     return test_list;
    // }

    // variable_to_internal_html(tags_dict, tag_content){
    //     $.each(tags_dict, (variable_name, variable_content)=>{
    //         tag_content = tag_content.replaceAll(variable_name, variable_content)
    //     })
    //     return tag_content
    // }
}

class ObjectToHTML extends CustomFunctionTag{
    constructor(...props){
        super(...props);

        // this.html_cleaning();
        this.request_for_original_html();
    }

    async request_for_original_html(){
        await this.get_original_html();
    }

    async get_original_html(){
        console.log('Запрос оригинального html')
        return new Promise((resolve, reject)=>{
            $.ajax({
                url: window.location.href,
                method: 'GET',
                dataType: 'html',
                async: true,
                success: (response)=>{
                    this.html = response;
                    console.log('Оригинальный html получен')
                    resolve();
                },
                error: (xhr, errro, status)=>{
                    reject();
                }
            });
        });
    }  

    // async html_cleaning(){
    //     console.log('Запуск процесса очистки тегов')
    //     let variables_tags = this.get_html_tags_list('variable', null, true);
    //     let functions_tags = this.get_html_tags_list('function');
    //     console.log(variables_tags, functions_tags)
    //     functions_tags = this.set_tag_dependencies(functions_tags);
    //     // console.log(variables_tags, functions_tags)
    //     try {
    //         for (let i=0; i<functions_tags.length; i++){
    //             let tag = functions_tags[i];
    //             tag = this.get_function_tag_code(tag);
    
    //             if (tag.is_endtag){
    //                 functions_tags.splice(i, 1);
    //                 i--;
    //                 continue;
    //             }
                
    //             tag.content.full = '';
    //         }
    
    //         for (let i=0; i<variables_tags.length; i++){
    //             variables_tags[i].content = '';
    //         }
    //         // console.log(variables_tags, functions_tags)
    //     } catch (error) {
    //         console.error(error);
    //     } finally {
    //         this.content_to_html(functions_tags, 'function');
    //         this.content_to_html(variables_tags, 'variable');
    //         console.log('Процесс очистки тегов закончен')
    //     }
    // }

     /**
     * @ A method that starts the process of processing variable tags and function tags, and substituting objects that correspond to them.
     * @ The launch is carried out by running the:
     * @ get_html_tags_variable() 
     * @ and 
     * @ get_html_tags_function() 
     * @ methods.
     */
    async tag_processing(){
        console.log('Начало обработки тегов')
        this.new_html = this.html;
        await this.get_html_tags_function();
        await this.get_html_tags_variable();
        console.log('Конец обработки')
        this.render_html();
    }

    render_html(){
        document.getElementsByTagName('html')[0].innerHTML = this.new_html;
    }
}

class DetailViewAPIRequest {
    constructor(props){
        this.api_url = props.api_url;
        this.success = props.success;

        this.object;

        this.html = document.getElementsByTagName('html')[0].innerHTML;
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
                    $.each(response, (key, value)=>{
                        self[key] = value;
                    });
                    self.success(response);
                    resolve(response);
                },
                error: (xhr, error, status)=>{
                    console.error(`Error: ${error}, Status: ${xhr.status}, ${status}`)
                    reject();
                }
            })
        })
    }
}

class UpdateViewAPIRequest extends DetailViewAPIRequest {
    constructor(props){
        super(props);
    }
}

class ListViewAPIRequest extends DetailViewAPIRequest {
    constructor(props){
        super(props);

        // this.get_object_list();
    }

    async get_object_list(){
        return await super.get_object();
    };
}

class RelatedFieldAPIRequest extends ListViewAPIRequest {
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