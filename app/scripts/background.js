// {url: {title, desc, tag, time, isSaved, isSaving}}
var pages = {}, _userInfo;

var getPopup = function () {
  return chrome.extension.getViews({type: 'popup'})[0];
};

var makeBasicAuthHeader = function(user, password) {
  var tok = user + ':' + password;
  var hash = btoa(tok);
  return 'Basic ' + hash;
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
  localStorage.removeItem(authTokenKey);
  localStorage.removeItem(nopingKey);
  var popup = getPopup();
  popup && popup.$rootScope &&
              popup.$rootScope.$broadcast('logged-out');
};

var getUserInfo = function () {
  if (!_userInfo) {
    if (localStorage[checkedkey]) {
      _userInfo = {isChecked: localStorage[checkedkey],
                   authToken: localStorage[authTokenKey],
                   name: localStorage[namekey],
                   pwd: localStorage[pwdkey]};
    } else {
      _userInfo = {isChecked: false, authToken: '',
                   name: '', pwd: ''};
    }
  }
  return _userInfo;
};

// for popup.html to acquire page info
// if there is no page info at local then get it from server
var getPageInfo = function (url) {
  if (!url || url.indexOf('chrome://') == 0 || localStorage[nopingKey] === 'true') {
    return {url: url, isSaved:false};
  }
  var pageInfo = pages[url];
  if (pageInfo) {
    return pageInfo;
  }
  // download now
  updatePageInfo(url);
  return null;
};

// refresh page info even page info has fetched from server
var updatePageInfo = function (url) {
  var popup = getPopup();
  popup && popup.$rootScope &&
              popup.$rootScope.$broadcast('show-loading', 'Loading bookmark...');
  var cb = function (pageInfo) {
    var popup = getPopup();
    popup && popup.$rootScope &&
                popup.$rootScope.$broadcast('render-page-info', pageInfo);
    updateSelectedTabExtIcon();
  };
  queryPinState({url: url, ready: cb});
};

var handleError = function (data) {
  var popup = getPopup();
  if (data.status == 0 || data.statusText == 'error'){
    popup && popup.$rootScope &&
    popup.$rootScope.$broadcast('error', 'Error, please check your connection.');
  } else {
    popup && popup.$rootScope &&
    popup.$rootScope.$broadcast('error', 'Error, Pinboard API is probably down.');
  }
};

var login = function (token) {
  // test auth
  var path = mainPath + 'user/api_token',
      jqxhr = $.ajax({url: path,
                      data: {format:'json', auth_token: token},
                      type : 'GET',
                      timeout: REQ_TIME_OUT,
                      dataType: 'json',
                      crossDomain: true,
                      contentType:'text/plain'
      });
  jqxhr.done(function (data) {
    var popup = getPopup();
    if (data.result) {
      // success
      _userInfo.authToken = token;
      _userInfo.name = token.split(':')[0];
      _userInfo.isChecked = true;
      localStorage[namekey] = token.split(':')[0];
      localStorage[authTokenKey] = token;
      localStorage[checkedkey] = true;
      popup && popup.$rootScope &&
                                 popup.$rootScope.$broadcast('login-succeed');
      _getTags();
    } else {
      // login error
      var popup = getPopup();
      popup && popup.$rootScope &&
                  popup.$rootScope.$broadcast('login-failed');
    }
  });
  jqxhr.fail(function (data) {
    var popup = getPopup();
    if (data.status == 401 || data.status == 500) {
      popup && popup.$rootScope &&
      popup.$rootScope.$broadcast('login-failed');
    } else {
      handleError(data);
    }
  });
};

var QUERY_INTERVAL = 3 * 1000, isQuerying = false, tQuery;
var queryPinState = function (info) {
  var userInfo = getUserInfo(),
      url = info.url,
      handler = function (data) {
        isQuerying = false;
        clearTimeout(tQuery);
        var posts = data.posts,
            pageInfo = {isSaved: false};
        if (posts.length) {
          var post = posts[0];
          pageInfo = {url: post.href,
                      title: post.description,
                      desc: post.extended,
                      tag: post.tags,
                      time: post.time,
                      shared: post.shared == 'no' ? false:true,
                      toread: post.toread == 'yes' ? true:false,
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
    var settings = {url: mainPath + 'posts/get',
                    type : 'GET',
                    data: {url: url, format: 'json'},
                    //timeout: REQ_TIME_OUT,
                    dataType: 'json',
                    crossDomain: true,
                    contentType:'text/plain'};
    if (userInfo.authToken) {
      settings.data.auth_token = userInfo.authToken;
    } else {
      settings.headers = {'Authorization': makeUserAuthHeader()};
    }
    var jqxhr = $.ajax(settings);
    jqxhr.done(handler);
    jqxhr.fail(handleError);
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
    var desc = info.desc;
    if (desc.length > maxDescLen) {
      desc = desc.slice(0, maxDescLen) + '...'
    }
    var path = mainPath + 'posts/add',
        data = {description: info.title, url: info.url,
                extended: desc, tags: info.tag, format: 'json'};
    info.shared && (data['shared'] = info.shared);
    info.toread && (data['toread'] = info.toread);
    var settings = {url: path,
                    type : 'GET',
                    timeout: REQ_TIME_OUT,
                    dataType: 'json',
                    crossDomain: true,
                    data: data,
                    contentType:'text/plain'};
    if (userInfo.authToken) {
      settings.data.auth_token = userInfo.authToken;
    } else {
      settings.headers = {'Authorization': makeUserAuthHeader()};
    }
    var jqxhr = $.ajax(settings);
    jqxhr.done(function (data) {
      var resCode = data.result_code;
      if (pages[info.url]) {
        pages[info.url].isSaved = resCode == 'done' ? true : false;
      } else {
        pages[info.url] = {isSaved: resCode == 'done' ? true : false};
      }
      updateSelectedTabExtIcon();
      queryPinState({url: info.url, isForce: true});
      var popup = getPopup();
      popup && popup.close();
    });
    jqxhr.fail(function (data) {
      if (pages[info.url]) {
        pages[info.url].isSaved = false;
      } else {
        pages[info.url] = {isSaved: false};
      }
    });
    // change icon state
    if (pages[info.url]) {
      pages[info.url].isSaving = true;
    } else {
      pages[info.url] = {isSaving: true};
    }
    updateSelectedTabExtIcon();
  }
};

var deletePost = function (url) {
  var userInfo = getUserInfo();
  if (userInfo && userInfo.isChecked && url) {
    var path = mainPath + 'posts/delete';
    var settings = {url: path,
                    type : 'GET',
                    timeout: REQ_TIME_OUT,
                    dataType: 'json',
                    crossDomain: true,
                    data: {url: url, format: 'json'},
                    contentType: 'text/plain'};
    if (userInfo.authToken) {
      settings.data.auth_token = userInfo.authToken;
    } else {
      settings.headers = {'Authorization': makeUserAuthHeader()};
    }
    var jqxhr = $.ajax(settings);
    jqxhr.done(function (data) {
      var resCode = data.result_code;
      if (resCode == 'done' || resCode == 'item not found') {
        delete pages[url];
        updateSelectedTabExtIcon();
      } else {
        // error
        var popup = getPopup();
        popup && popup.$rootScope &&
                    popup.$rootScope.$broadcast('error');
      }
      var popup = getPopup();
      popup && popup.close();
    });
    jqxhr.fail(handleError);
  }
};

var getSuggest = function (url) {
  var userInfo = getUserInfo();
  if (userInfo && userInfo.isChecked && url) {
    var path = mainPath + 'posts/suggest';
    var settings = {url: path,
                    type : 'GET',
                    data: {url: url, format: 'json'},
                    timeout: REQ_TIME_OUT,
                    dataType: 'json',
                    crossDomain: true,
                    contentType:'text/plain'};
    if (userInfo.authToken) {
      settings.data.auth_token = userInfo.authToken;
    } else {
      settings.headers = {'Authorization': makeUserAuthHeader()};
    }
    var jqxhr = $.ajax(settings);
    jqxhr.always(function (data) {
      var popularTags = [], recommendedTags = [];
      if (data && data.length > 0) {
        popularTags = data[0].popular;
        recommendedTags = data[1].recommended;
      }
      // default to popluar tags, add new recommended tags
      var suggests = popularTags.slice();
      $.each(recommendedTags, function(index, tag){
        if(popularTags.indexOf(tag) === -1){
          suggests.push(tag);
        }
      });
      var popup = getPopup();
      popup && popup.$rootScope &&
                  popup.$rootScope.$broadcast('render-suggests', suggests);
    });
  }
};

var _tags = [], _tagsWithCount = {};
// acquire all user tags from server refresh _tags
var _getTags = function () {
  var userInfo = getUserInfo();
  if (userInfo && userInfo.isChecked) {
    var path = mainPath + 'tags/get',
        settings = {url: path,
                    type : 'GET',
                    data: {format: 'json'},
                    timeout: REQ_TIME_OUT,
                    dataType: 'json',
                    crossDomain: true,
                    contentType:'text/plain'};
    if (userInfo.authToken) {
      settings.data.auth_token = userInfo.authToken;
    } else {
      settings.headers = {'Authorization': makeUserAuthHeader()};
    }
    var jqxhr = $.ajax(settings);
    jqxhr.always(function (data) {
      if (data) {
        _tags = _.sortBy(_.keys(data),
                         function (tag) {
                           return data[tag].count;
                         }).reverse();
      }
    });
  }
};
_getTags();

var getTags = function () {
  return _tags;
};
var getTagsWithCount = function () {
  return _tagsWithCount;
};


// query at first time extension loaded
chrome.tabs.getSelected(null, function (tab) {
  if (localStorage[nopingKey] === 'true') {
    return;
  }
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
    if (localStorage[nopingKey] === 'true') {
      return;
    }
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
    if (localStorage[nopingKey] === 'true') {
      return;
    }
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
