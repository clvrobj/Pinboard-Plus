chrome.runtime.onMessage.addListener(
  function(message, sender, sendResponse) {
    if (message.method == 'getKeywordsSuggestionTags') {
	  var metas = document.getElementsByTagName('meta');
	  for (var i=0; i < metas.length; i++) {
	    if (metas[i].getAttribute('name') === 'keywords') {
		  var tags = metas[i].getAttribute('content').toLowerCase().replace(/,/g, ' ').replace(/;/, '').split(/(\s+)/).filter(function(e) { return e.trim().length > 0; }).sort().filter(function(item, pos, ary) {return !pos || item != ary[pos - 1];});
		  break;
		}
      }
      sendResponse({data: tags});
    }
  }
);
