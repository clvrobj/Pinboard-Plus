// {url: {title, desc, tag, time, isSaved, isSaving}}
var pages = {};

var getPopup = function () {
  return chrome.extension.getViews({type: 'popup'})[0];
};

var logout = function () {
  Pinboard.logout(function () {
    var popup = getPopup();
    popup && popup.$rootScope &&
      popup.$rootScope.$broadcast('logged-out');
  });
};

var getUserInfo = function () {
  return Pinboard.getUserInfo();
};

// for popup.html to acquire page info
// if there is no page info at local then get it from server
var getPageInfo = function (url) {
  if (!url || url.indexOf('chrome://') == 0 ||
      localStorage[nopingKey] === 'true') {
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
  Pinboard.login(
    token,
    function (data) {
      var popup = getPopup();
      if (data.result) {
        popup && popup.$rootScope &&
          popup.$rootScope.$broadcast('login-succeed');
        _getTags();
      } else {
        // login error
        popup && popup.$rootScope &&
          popup.$rootScope.$broadcast('login-failed');
      }
    },
    function (data) {
      var popup = getPopup();
      if (data.status == 401 || data.status == 500) {
        popup && popup.$rootScope &&
          popup.$rootScope.$broadcast('login-failed');
      } else {
        handleError(data);
      }
    }
  );
};


var QUERY_INTERVAL = 3 * 1000, isQuerying = false, tQuery;
var queryPinState = function (info) {
  var url = info.url,
      done = function (data) {
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
  if ((info.isForce || !isQuerying) && Pinboard.isLoggedin() &&
      info.url && info.url != 'chrome://newtab/') {
    isQuerying = true;
    clearTimeout(tQuery);
    tQuery = setTimeout(function () {
      // to make the queries less frequently
      isQuerying = false;
    }, QUERY_INTERVAL);
    Pinboard.queryPinState(url, done, handleError);
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
  if (Pinboard.isLoggedin && info.url && info.title) {
    var desc = info.desc;
    if (desc.length > maxDescLen) {
      desc = desc.slice(0, maxDescLen) + '...';
    }
    var doneFn = function (data) {
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
    };
    var failFn = function (data) {
      if (pages[info.url]) {
        pages[info.url].isSaved = false;
      } else {
        pages[info.url] = {isSaved: false};
      }
    };
    Pinboard.addPost(info.title, info.url, desc, info.tag,
                     info.shared, info.toread, doneFn, failFn);
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
  if (Pinboard.isLoggedin() && url) {
    var doneFn = function (data) {
      var resCode = data.result_code;
      var popup = getPopup();
      if (resCode == 'done' || resCode == 'item not found') {
        delete pages[url];
        updateSelectedTabExtIcon();
      } else {
        // error
        popup && popup.$rootScope &&
          popup.$rootScope.$broadcast('error');
      }
      popup && popup.close();
    };
    Pinboard.deletePost(url, doneFn, handleError);
  }
};

var getSuggest = function (url) {
  if (Pinboard.isLoggedin() && url) {
    var doneFn = function (data) {
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
    };
    Pinboard.getSuggest(url, doneFn);
  }
};

var _tags = [];
// acquire all user tags from server refresh _tags
var _getTags = function () {
  if (Pinboard.isLoggedin()) {
    var doneFn = function (data) {
      if (data) {
        _tags = _.sortBy(_.keys(data),
                         function (tag) {
                           return data[tag].count;
                         }).reverse();
      }
    };
    Pinboard.getTags(doneFn);
  }
};
_getTags();

var getTags = function () {
  return _tags;
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
