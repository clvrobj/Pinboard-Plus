// {url: {title, desc, tag, time, isSaved[0: not saved; 1: saved; 2: saving]}}
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
  Notifications.clearAll();
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
  var message;
  if (data.status == 0 || data.statusText == 'error'){
    message = 'Please check your connection.';
  } else if (data.status == 401) {
    message = 'Something wrong with the auth. Please try to login again.';
  } else {
    message = 'Pinboard API is probably down.';
  }
  Notifications.add(message, 'error');
};

var addAndShowNotification = function (message, type) {
  Notifications.add(message, type);
  var popup = getPopup();
  popup && popup.$rootScope &&
    popup.$rootScope.$broadcast('show-notification');
};

var getNotification = function () {
  return Notifications.getTop();
};

var closeNotification = function () {
  Notifications.remove();
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
        addAndShowNotification(
          'Login Failed. The token format is user:TOKEN.', 'error');
      }
    },
    function (data) {
      var popup = getPopup();
      if (data.status == 401 || data.status == 500) {
        addAndShowNotification(
          'Login Failed. The token format is user:TOKEN.', 'error');
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
    if (pageInfo && pageInfo.isSaved == 1) {
      iconPath = yesIcon;
    } else if (pageInfo && pageInfo.isSaved == 2) {
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
        pages[info.url].isSaved = 0;
      } else {
        pages[info.url] = {isSaved: 0};
      }
      updateSelectedTabExtIcon();
      var saveFailedMsg, failReason;
      if (info.title.length > 47) {
        var title = info.title.slice(0, 47) + '...';
        saveFailedMsg = 'The post <b>' + title + '</b> is not saved. ';
      } else {
        saveFailedMsg = 'The post <b>' + info.title + '</b> is not saved. ';
      }
      if (data.status == 0 || data.statusText == 'error'){
        failReason = 'Please check your connection.';
      } else if (data.status == 401) {
        failReason = 'Something wrong with the auth. Please try to login again.';
      } else {
        failReason = 'Pinboard API is probably down.';
      }
      var message = saveFailedMsg + failReason;
      // only store error and no need to show as popup is close
      Notifications.add(message, 'error');
    };
    Pinboard.addPost(info.title, info.url, desc, info.tag,
                     info.shared, info.toread, doneFn, failFn);
    // change icon state
    if (pages[info.url]) {
      pages[info.url].isSaved = 2;
    } else {
      pages[info.url] = {isSaved: 2};
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
  if (!_tags || _tags.length === 0) {
    _getTags();
  }
  return _tags;
};

Notifications.init();

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
  }
);

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
  }
);
