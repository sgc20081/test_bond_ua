$(document).ready(function(){

    console.log('Js for API sends connected')
    test_api_send();

});

function test_api_send(){

    let form = $('.api-form');
    form.on('submit', function (e){
        console.log('Sending form');
        e.preventDefault();

        let form_data = {};
        let inputs = form.find('input');
        let selects = form.find('select');

        $.each(inputs, (ind, input)=>{
            form_data[input.name] = input.value;
        });

        let selected_optns = [];

        $.each(selects, (ind, select)=>{

            let selected_optns = [];

            $.each(select.selectedOptions, (ind, selected_option)=>{
                let select_dict = {};
                select_dict['id'] = selected_option.value;
                select_dict[selected_option.name] = selected_option.innerText;
                selected_optns.push(id);
            });

            form_data[select.name] = selected_optns;
        });

        form_data = JSON.stringify(form_data);

        console.log(form_data);

        $.ajax({
            url: 'create-movie-api',
            method: 'POST',
            contentType: 'application/json',
            data: form_data,
            success: function(response){
                console.log(response)
            },
            error: (xhr, status, error)=>{
                console.error(`AJAX error: ${xhr}, ${status}, ${error}`);
                main_function();
            },
        })
    })
}