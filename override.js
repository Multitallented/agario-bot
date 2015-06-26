document.addEventListener('beforeload', function(event) {
    if (event.url.indexOf("main_out.js?") != -1){event.srcElement.src='';}
}, true);