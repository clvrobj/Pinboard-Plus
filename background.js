// query at first time extension loaded
chrome.tabs.getSelected(null, function (tab) {
                            queryPinState({url: tab.url,
                                           ready: function (pageInfo) {
                                               if (pageInfo && pageInfo.isSaved) {
                                                   chrome.browserAction.setIcon(
                                                       {path: yesIcon, tabId: tab.id});
                                               }
                                           }});
                        });

chrome.tabs.onUpdated.addListener(
    function(id, changeInfo, tab) {
        if (changeInfo.url) {
            var url = changeInfo.url;
            if (!pages.hasOwnProperty(url)) {
                chrome.browserAction.setIcon({path: noIcon, tabId: tab.id});
                queryPinState({url: url,
                               ready: function (pageInfo) {
                                   if (pageInfo && pageInfo.isSaved) {
                                       chrome.browserAction.setIcon(
                                           {path: yesIcon, tabId: tab.id});
                                   }
                               }});
            }
        }
        var url = changeInfo.url || tab.url;
        if (pages[url] && pages[url].isSaved) {
            chrome.browserAction.setIcon({path: yesIcon, tabId: tab.id});
        }
    });

chrome.tabs.onSelectionChanged.addListener(
    function(tabId, selectInfo) {
        chrome.tabs.getSelected(
            null, function (tab) {
                var url = tab.url;
                if (!pages.hasOwnProperty(url)) {
                    queryPinState({url: url,
                                   ready: function (pageInfo) {
                                       if (pageInfo && pageInfo.isSaved) {
                                           chrome.browserAction.setIcon(
                                               {path: yesIcon, tabId: tab.id});
                                       }
                                   }});
                }
            });
    });
