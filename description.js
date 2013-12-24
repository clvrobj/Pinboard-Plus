chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
        if (request.method == "getDescription") {
        	var description = window.getSelection().toString();
        	if (!description || description == "") {
                var metas = document.getElementsByTagName("meta"); 
                for (i=0; i<metas.length; i++) { 
                    if (metas[i].getAttribute("name") === "description") { 
                        description = metas[i].getAttribute("content"); 
                        break;
                    } 
                }
            }
            sendResponse({data: description});
        }
        else {
            sendResponse({});
        }
    });
