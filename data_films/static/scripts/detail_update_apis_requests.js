$(document).ready(function(){
    // get_request_api();
    // get_html_tags();


});

let object_detail_request_url = sessionStorage.getItem('request_object_url')
var movie;

if (object_detail_request_url !== undefined) {
    
    movie = new DetailViewApiRequest({
        api_url: `api/${object_detail_request_url}`,
        success: ()=>{

        }
    });
}



// function get_request_api(){
//     let object_detail_request_url = sessionStorage.getItem('request_object_url')

//     if (object_detail_request_url !== undefined) {
        
//         let movie = new DetailViewApiRequest({
//             api_url: `api/${object_detail_request_url}`,
//             success: ()=>{
//                 console.log(movie.object)
//             }
//         });
//     }
// };