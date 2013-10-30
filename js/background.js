// {url: {title, desc, tag, time, isSaved, isSaving, isPendding}}
var pages = {};

var makeBasicAuthHeader = function(user, password) {
    var tok = user + ':' + password;
    var hash = btoa(tok);
    return "Basic " + hash;
};

var makeUserAuthHeader = function() {
    var userInfo = getUserInfo();
    return makeBasicAuthHeader(userInfo.name, userInfo.pwd);
};

var logout = function () {
    _userInfo.isChecked = false;
    localStorage.removeItem(checkedkey);
    localStorage.removeItem(namekey);
    localStorage.removeItem(pwdkey);
    localStorage.removeItem(nopingKey);
    var popup = chrome.extension.getViews({type: 'popup'})[0];
    popup.showLoginWindow();
};

var getUserInfo = function () {
    if (!_userInfo) {
        if (localStorage[checkedkey]) {
            _userInfo = {isChecked: localStorage[checkedkey],
                        name: localStorage[namekey],
                        pwd: localStorage[pwdkey]};
        } else {
            _userInfo = {name: '', pwd: '', isChecked: false};
        }
    }
    return _userInfo;
};

NamedNodeMap.prototype.getAttrVal = function (attrName) {
    var attr = this.getNamedItem(attrName);
    if (attr) {
        return attr.nodeValue;
    }
    return null;
};

// for popup.html to acquire page info
// if there is no page info at local then get it from server
var getPageInfo = function (url) {
    if (!url || url == 'chrome://newtab/' || localStorage[nopingKey] === 'true') {
        return {isSaved:false};
    }
    var pageInfo = pages[url];
    if (pageInfo) {
        return pageInfo;
    } else { // download now
        updatePageInfo(url);
    }
    return null;
};

// refresh page info even page info has fetched from server
var updatePageInfo = function (url) {
    var popup = chrome.extension.getViews({type: 'popup'})[0];
    popup && popup.showLoading('Loading bookmark...');
    var cb = function (pageInfo) {
        popup && popup.renderPageInfo(pageInfo);
        updateSelectedTabExtIcon();
    };
    queryPinState({url: url, ready: cb});
};

var login = function (name, pwd) {
    // test auth
    var path = mainPath + 'posts/update';
    var jqxhr = $.ajax({url: path,
                        type : 'GET',
                        timeout: REQ_TIME_OUT,
                        dataType: 'json',
                        crossDomain: true,
                        contentType:'text/plain',
                        headers: {'Authorization': makeBasicAuthHeader(name, pwd)}
                    });
    jqxhr.always(function (data) {
                     var res = $(data.responseXML).find('update'),
                     resTime = res.attr('time');
                     if (resTime) { // success
                         _userInfo.name = name;
                         _userInfo.pwd = pwd;
                         _userInfo.isChecked = true;
                         localStorage[namekey] = name;
                         localStorage[pwdkey] = pwd;
                         localStorage[checkedkey] = true;
                         chrome.tabs.getSelected(
                             null, function (tab) {
                                 updatePageInfo(tab.url);
                             });
                         _getTags();
                     } else {
                         // error
                         var popup = chrome.extension.getViews({type: 'popup'})[0];
                         popup.loginFailed();
                     }
                 });
    jqxhr.fail(function (data) {
                   if (data.statusText == 'timeout') {
                   }
               });
};

var QUERY_INTERVAL = 3 * 1000, isQuerying = false, tQuery;
var queryPinState = function (info) {
    var userInfo = getUserInfo();
    var url = info.url;
    var handler = function (data) {
        isQuerying = false;
        clearTimeout(tQuery);
        var post = $(data.responseXML).find('post'),
        pageInfo = {isSaved: false};
        if (post.length) {
            pageInfo = {url: post.attr("href"),
                title: post.attr("description"),
                desc: post.attr("extended"),
                tag: post.attr("tag"),
                time: post.attr("time"),
                shared: post.attr("shared") == 'no' ? false:true,
                toread: post.attr("toread") == 'yes' ? true:false,
                isSaved: true};
        }
        pages[url] = pageInfo;
        info.ready && info.ready(pageInfo);
    };
    if ((info.isForce || !isQuerying) && userInfo && userInfo.isChecked &&
        info.url && info.url != 'chrome://newtab/') {
        isQuerying = true;
        clearTimeout(tQuery);
        tQuery = setTimeout(function () {
                                isQuerying = false;
                            }, QUERY_INTERVAL);
        var jqxhr = $.ajax({url: mainPath + 'posts/get?url=' + url,
                            type : 'GET',
                            //timeout: REQ_TIME_OUT,
                            dataType: 'json',
                            crossDomain: true,
                            contentType:'text/plain',
                            headers: {'Authorization': makeUserAuthHeader()}
                        });

        jqxhr.always(handler);
        jqxhr.fail(function (data) {
                       if (data.statusText == 'timeout') {
                           delete pages[url];
                       }
                   });
    }
};

var updateSelectedTabExtIcon = function () {
    chrome.tabs.getSelected(null, function (tab) {
                                var pageInfo = pages[tab.url];
                                var iconPath = noIcon;
                                if (pageInfo && pageInfo.isSaved) {
                                    iconPath = yesIcon;
                                } else if (pageInfo && pageInfo.isSaving) {
                                    iconPath = savingIcon;
                                }
                                chrome.browserAction.setIcon(
                                    {path: iconPath, tabId: tab.id});
                        });
};

var addPost = function (info) {
    var userInfo = getUserInfo();
    if (userInfo && userInfo.isChecked && info.url && info.title) {
        var path = mainPath + 'posts/add?',
        data = {description: info.title, url: info.url,
                extended: info.desc, tags: info.tag};
        info.shared && (data['shared'] = info.shared);
        info.toread && (data['toread'] = info.toread);
        var jqxhr = $.ajax({url: path,
                            type : 'GET',
                            timeout: REQ_TIME_OUT,
                            dataType: 'json',
                            crossDomain: true,
                            data: data,
                            contentType:'text/plain',
                            headers: {'Authorization': makeUserAuthHeader()}
                        });
        jqxhr.always(function (data) {
                         var res = $(data.responseXML).find('result'),
                         resCode = res.attr('code');
                         if (resCode == 'done') {
                             // done
                             pages[info.url] = {isSaved: true};
                         } else {
                             // error
                             pages[info.url] = {isSaved: false};
                         }
                         updateSelectedTabExtIcon();
                         queryPinState({url: info.url, isForce: true});
                       });
        jqxhr.fail(function (data) {
                   });
        var popup = chrome.extension.getViews({type: 'popup'})[0];
        popup && popup.close();
        // change icon state
        pages[info.url] = {isSaving: true};
        updateSelectedTabExtIcon();
    }
};

var deletePost = function (url) {
    var userInfo = getUserInfo();
    if (userInfo && userInfo.isChecked && url) {
        var path = mainPath + 'posts/delete?';
        var jqxhr = $.ajax({url: path,
                            type : 'GET',
                            timeout: REQ_TIME_OUT,
                            dataType: 'json',
                            crossDomain: true,
                            data: {url: url},
                            contentType:'text/plain',
                            headers: {'Authorization': makeUserAuthHeader()}
                        });
        jqxhr.always(function (data) {
                         var res = $(data.responseXML).find('result'),
                         resCode = res.attr('code');
                         if (resCode == 'done') {
                             delete pages[url];
                             updateSelectedTabExtIcon();
                         } else {
                             // error
                         }
                         var popup = chrome.extension.getViews({type: 'popup'})[0];
                         popup && popup.close();
                     });
    }
};

var getSuggest = function (url) {
    var userInfo = getUserInfo();
    if (userInfo && userInfo.isChecked && url) {
        var path = mainPath + 'posts/suggest?format=json&url=' + url,
        jqxhr = $.ajax({url: path,
                        type : 'GET',
                        timeout: REQ_TIME_OUT,
                        dataType: 'json',
                        crossDomain: true,
                        contentType:'text/plain',
                        headers: {'Authorization': makeUserAuthHeader()}
                    });
        jqxhr.always(function (data) {
                        var popularTags = data[0].popular;
                        var recommendedTags = data[1].recommended;

                        // default to popluar tags, add new recommended tags
                        var suggests = popularTags.slice();
                        var popup = chrome.extension.getViews({type: 'popup'})[0];
                        $.each(recommendedTags, function(index, tag){
                          if(popularTags.indexOf(tag) === -1){
                            suggests.push(tag);
                          }
                        });
                        popup && popup.renderSuggests(suggests);
                     });
    }
};

var getTags = function () {
    return _tags;
};

// acquire all user tags from server refresh _tags
var _getTags = function () {
    var userInfo = getUserInfo();
    if (userInfo && userInfo.isChecked) {
        var path = mainPath + 'tags/get',
        jqxhr = $.ajax({url: path,
                        type : 'GET',
                        timeout: REQ_TIME_OUT,
                        dataType: 'json',
                        crossDomain: true,
                        contentType:'text/plain',
                        headers: {'Authorization': makeUserAuthHeader()}
                    });
        jqxhr.always(function (data) {
                         var res = $(data.responseXML).find('tag');
                         _tags = [];
                         for (var i=0, len = res.length; i<len; i++) {
                             _tags.push(res[i].attributes.getAttrVal('tag'));
                         }
                     });
    }
};
_getTags();

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
