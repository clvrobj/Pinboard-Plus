var bg = chrome.extension.getBackgroundPage(), curTabUrl = '', tags = [];

var SEC = 1000, MIN = SEC*60, HOUR = MIN*60, DAY = HOUR*24, WEEK = DAY*7;
Date.prototype.getTimePassed = function () {
    var ret = {day: 0, hour: 0, min: 0, sec: 0, offset: -1},
    offset = new Date() - this;
    if (offset<=0) return ret;
    ret.offset = offset;
    ret.week = Math.floor(offset/WEEK); var r = offset%WEEK;
    ret.day = Math.floor(offset/DAY); var r = offset%DAY;
    ret.hour = Math.floor(r/HOUR), r = r%HOUR;
    ret.min = Math.floor(r/MIN), r = r%MIN;
    ret.sec = Math.floor(r/SEC);
    return ret;
};

var renderSuggests = function (suggests) {
    if (suggests && suggests.length) {
        var suggestsStr = '';
        for (var i=0, len = suggests.length; i<len; i++) {
            suggestsStr = suggestsStr.concat('<a href="#">', suggests[i], '</a>');
        }
        $('#suggest').html(suggestsStr);
        $('#suggest a').click(function (e) {
                                  var s = $(e.target).text(), t = $('#tag').val();
                                  if ($.inArray(s, t.split(' ')) == -1) {
                                      $('#tag').val(t + ' ' + s);
                                  }
                              });
    }
};

var renderPageInfo = function (pageInfo) {
    var userInfo = checkLogin();
    if (userInfo) {
        hideLoading();
        if (pageInfo.isSaved) {
            bg.getSuggest(pageInfo.url);
            $('#user').text(userInfo.name);
            pageInfo.url && $('#url').val(pageInfo.url);
            pageInfo.title && $('#title').val(pageInfo.title);
            pageInfo.desc && $('#desc').val(pageInfo.desc);
            pageInfo.tag && $('#tag').val(pageInfo.tag.concat(' '));
            $('#private').attr('checked', !pageInfo.shared);
            $('#toread').attr('checked', pageInfo.toread);
            if (pageInfo.time) {
                var passed = new Date(pageInfo.time).getTimePassed(),
                dispStr = 'previously saved ',
                w = passed.week, d = passed.day, h = passed.hour;
                if (passed.offset > WEEK) {
                    dispStr = dispStr.concat(passed.week, ' ', 'weeks ago');
                } else if (passed.offset > DAY) {
                    dispStr = dispStr.concat(passed.day, ' ', 'days ago');
                } else if (passed.offset > HOUR){
                    dispStr = dispStr.concat(passed.hour, ' ', 'hours ago');
                } else {
                    dispStr = dispStr.concat('just now');
                }
                $('.alert').show().html(dispStr);
                $('#delete').show();
            }
        } else {
            initPopup();
        }
        $('#tag').focus();
    }
};

var getPageInfo = function (url) {
    var cb = function (pageInfo) {
        renderPageInfo(pageInfo);
    };
    var pageInfo = bg.getPageInfo(url);
    if (pageInfo) {
        renderPageInfo(pageInfo);
    } else {
        showLoading();
    }
};

var checkLogin = function () {
    var userInfo = bg.getUserInfo();
    if (!userInfo || !userInfo.isChecked) {
        showLoginWindow();        
        return false;
    } else {
        hideLoginWindow();
        return userInfo;
    }
};

var initPopup = function () {
    var userInfo = checkLogin();
    if (userInfo) {
        $('#user').text(userInfo.name);
        $('#user').unbind('click').click(
            function () {
                chrome.tabs.create(
                    {url: 'https://pinboard.in/u:'+userInfo.name});
                var popup = chrome.extension.getViews(
                    {type: 'popup'})[0];
                popup && popup.close();
            });
        chrome.tabs.getSelected(
            null, function (tab) {
                $('#url').val(tab.url);
                $('#title').val(tab.title);
                $('#desc').val('');
                $('#tags').val('');
                $('#private').attr('checked', false);
                $('#toread').attr('checked', false);
                $('.alert').hide();
                $('#delete').hide();
                $('.confirm').hide();
                $('logo-unlogin').hide();
                bg.getSuggest(tab.url);
            });
    }
};

var showLoading = function () {
    $('#state-mask').show();
},
hideLoading = function () {
    $('#state-mask').hide();
};

var showLoginWindow = function () {
    $('.logo-unlogin').show();
    $('#login-window').show();
    var submit = function () {
        showLoading();
        var name = $('#login-window #username').val(),
        pwd = $('#login-window #password').val();
        bg.login(name, pwd);
    };
    $('#login-window #username').unbind('keypress').keypress(
        function (e) {
            var code = e.keyCode || e.which;
            if(code == 13) {
                submit();
            }
        });
    $('#login-window #password').unbind('keypress').keypress(
        function (e) {
            var code = e.keyCode || e.which;
            if(code == 13) {
                submit();
            }
        });
    $('#login-window #login').unbind('click').click(submit);
},
hideLoginWindow = function () {
    $('.logo-unlogin').hide();
    $('#login-window').hide();
};

$(function () {
      initPopup();
      if (checkLogin()) {
          chrome.tabs.getSelected(
              null, function (tab) {
                  getPageInfo(tab.url);
              });
      }
      $('#submit').click(
          function () {
              showLoading();
              var info = {},
              url = $('#url').val(), title = $('#title').val(),
              desc = $('#desc').val(), tag = $('#tag').val();
              url && (info.url = url);
              title && (info.title = title);
              desc && (info.desc = desc);
              tag && (info.tag = tag);
              $('#private').attr('checked') && (info.shared = 'no');
              $('#toread').attr('checked') && (info.toread = 'yes');
              bg.addPost(info);
          });
      $('#delete').click(function () {
                             $(this).hide();
                             $('.confirm').show();
                         });
      $('#cancel-delete').click(function () {
                                    $('.confirm').hide();
                                    $('#delete').show();
                                });
      $('#destroy').click(function () {
                             showLoading();
                             chrome.tabs.getSelected(
                                 null, function (tab) {
                                     bg.deletePost(tab.url);
                                 });
                         });
      $('.logout').click(function () {
                             bg.logout();
                         });

      // auto complete
      var pos = $('#tag').offset();
      pos.top = pos.top + $('#tag').outerHeight();
      $('.auto-complete').css({'left': pos.left, 'top': pos.top});
      $('#tag').keyup(
          function (e) {
              var word = $(e.target).val(), match_inds = [];
              if (!word || word == '') {
                  $('.auto-complete').hide();
                  return;
              }
              var lis = $('.auto-complete li'), showedCount = 0;
              lis.addClass('exclude');
              for (var i=0, len=tags.length; i<len && showedCount < 5; i++) {
                  var tag = tags[i];
                  if (tag.indexOf(word) == 0) {
                      lis.eq(i).removeClass('exclude');
                      showedCount = showedCount + 1;
                  }
              }
              $('.auto-complete').show();
          });

      tags = bg.getTags();
      if (tags.length) {
          for (var i=0, len=tags.length; i<len; i++) {
              var con = $('<li>'.concat(tags[i], '</li>'));
              $('.auto-complete ul').append(con);
          }
      }
      $('.auto-complete').hide();
  });