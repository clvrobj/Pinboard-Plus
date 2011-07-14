// userInfo: name, pwd, isChecked
var _userInfo = null, _tags = [], keyprefix = 'pbuinfo',
namekey = keyprefix + 'n', pwdkey = keyprefix + 'p', checkedkey = keyprefix + 'c',
at = '@', pathBody = 'api.pinboard.in/v1/',
yesIcon = 'icon_black_19.png', noIcon = 'icon_grey_19.png';

var getMainPath = function () {
    var userInfo = getUserInfo(),
    authStr = userInfo.name + ':' + userInfo.pwd;
    return 'https://' + authStr + at + pathBody;
};

// {url, title, desc, tag, time, isSaved}
var pages = {};

var logout = function () {
    _userInfo.isChecked = false;
    localStorage.removeItem(checkedkey);
    localStorage.removeItem(namekey);
    localStorage.removeItem(pwdkey);
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
    var cb = function (pageInfo) {
        var popup = chrome.extension.getViews({type: 'popup'})[0];
        popup.renderPageInfo(pageInfo);
        updateSelectedTabExtIcon();
    };
    queryPinState({url: url, ready: cb});
};

var login = function (name, pwd) {
    // test auth
    pwd = encodeURIComponent(pwd);
    var path = 'https://' + name + ':' + pwd + at + pathBody + 'posts/update';
    var jqxhr = $.ajax({url: path,
                        type : 'GET',
                        dataType: 'json',
                        crossDomain: true,
                        contentType:'text/plain'});
    jqxhr.complete(function (data) {
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
};

var queryPinState = function (info) {
    var userInfo = getUserInfo();
    if (userInfo && userInfo.isChecked && info.url) {
        var url = info.url;
        var xhr = new XMLHttpRequest();
        xhr.open("GET", getMainPath() + 'posts/get?url=' + url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                var post = xhr.responseXML.documentElement.getElementsByTagName("post"), pageInfo;
                if (post.length > 0) {                    
                    var attrs = post[0].attributes;
                    pageInfo = {url: attrs.getAttrVal("href"), 
                                title: attrs.getAttrVal("description"),
                                desc: attrs.getAttrVal("extended"),
                                tag: attrs.getAttrVal("tag"),
                                time: attrs.getAttrVal("time"),
                                shared: attrs.getAttrVal("shared") == 'no' ? false:true,
                                toread: attrs.getAttrVal("toread") == 'yes' ? true:false,
                                isSaved: true};
                } else {
                    pageInfo = {isSaved: false};
                }
                pages[url] = pageInfo;
                info.ready && info.ready(pageInfo);
            }
        };
        xhr.send();
    }
};

var updateSelectedTabExtIcon = function () {
    chrome.tabs.getSelected(null, function (tab) {
                                var pageInfo = pages[tab.url];
                                var iconPath = noIcon;
                                if (pageInfo && pageInfo.isSaved) {
                                    iconPath = yesIcon;
                                }
                                chrome.browserAction.setIcon(
                                    {path: iconPath, tabId: tab.id});
                        });
};

var addPost = function (info) {
    var userInfo = getUserInfo();
    if (userInfo && userInfo.isChecked && info.url && info.title) {
        var path = getMainPath() + 'posts/add?',
        data = {description: info.title, url: info.url,
                extended: info.desc, tags: info.tag};
        info.shared && (data['shared'] = info.shared);
        info.toread && (data['toread'] = info.toread);
        var jqxhr = $.ajax({url: path,
                type : 'GET',
                dataType: 'json',
                crossDomain: true,
                data: data,
                contentType:'text/plain'});
        jqxhr.complete(function (data) {
                           var res = $(data.responseXML).find('result'),
                           resCode = res.attr('code');
                           if (resCode == 'done') {
                               updatePageInfo(info.url);
                           } else {
                               // error
                           }
                       });
    }
};

var deletePost = function (url) {
    var userInfo = getUserInfo();
    if (userInfo && userInfo.isChecked && url) {
        var path = getMainPath() + 'posts/delete?';
        var jqxhr = $.ajax({url: path,
                type : 'GET',
                dataType: 'json',
                crossDomain: true,
                data: {url: url},
                contentType:'text/plain'});
        jqxhr.complete(function (data) {
                           var res = $(data.responseXML).find('result'),
                           resCode = res.attr('code');
                           if (resCode == 'done') {
                               delete pages[url];
                               updatePageInfo(url);
                           } else {
                               // error
                           }
                       });
    }
};

var getSuggest = function (url) {
    var userInfo = getUserInfo();
    if (userInfo && userInfo.isChecked && url) {
        var path = getMainPath() + 'posts/suggest?url=' + url,
        jqxhr = $.ajax({url: path,
                type : 'GET',
                dataType: 'json',
                crossDomain: true,
                contentType:'text/plain'});
        jqxhr.complete(function (data) {
                           var res = $(data.responseXML).find('popular'),
                           suggests = [];
                           for (var i=0, len = res.length; i<len; i++) {
                               suggests.push($(res[i]).text());
                           }
                           var popup = chrome.extension.getViews({type: 'popup'})[0];
                           popup.renderSuggests(suggests);
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
        var path = getMainPath() + 'tags/get',
        jqxhr = $.ajax({url: path,
                type : 'GET',
                dataType: 'json',
                crossDomain: true,
                contentType:'text/plain'});
        jqxhr.complete(function (data) {
                           var res = $(data.responseXML).find('tag');
                           _tags = [];
                           for (var i=0, len = res.length; i<len; i++) {
                               _tags.push(res[i].attributes.getAttrVal('tag'));
                           }
                       });
    }
};
_getTags();

chrome.tabs.onUpdated.addListener(
    function(id, changeInfo, tab) {
        if (changeInfo.url) {
            var url = changeInfo.url;
            if (!pages[url]) {                
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

chrome.tabs.getSelected(null, function (tab) {
                            queryPinState({url: tab.url,
                                           ready: function (pageInfo) {
                                               if (pageInfo && pageInfo.isSaved) {
                                                   chrome.browserAction.setIcon(
                                                       {path: yesIcon,
                                                        tabId: tab.id});
                                               }
                                           }});
                        });

chrome.tabs.onSelectionChanged.addListener(
    function(tabId, selectInfo) {
        chrome.tabs.getSelected(null, function (tab) {
                            queryPinState({url: tab.url,
                                           ready: function (pageInfo) {
                                               if (pageInfo && pageInfo.isSaved) {
                                                   chrome.browserAction.setIcon(
                                                       {path: yesIcon,
                                                        tabId: tab.id});
                                               }
                                           }});
                        });
    });
