var Pinboard = {
  _userInfo: {isChecked: false, authToken: '',
              name: '', pwd: ''},
  getUserInfo: function () {
    if (this._userInfo.isChecked == false) {
      if (localStorage[checkedkey]) {
        this._userInfo = {isChecked: localStorage[checkedkey],
                          authToken: localStorage[authTokenKey],
                          name: localStorage[namekey],
                          pwd: localStorage[pwdkey]};
      }
    }
    return this._userInfo;
  },
  login: function (token, done, fail) {
    // test auth
    var path = mainPath + 'user/api_token';
    $.ajax({
      url: path,
      data: {format: 'json', auth_token: token},
      type : 'GET',
      timeout: REQ_TIME_OUT,
      dataType: 'json',
      crossDomain: true,
      contentType:'text/plain'
    }).done(function (data) {
      if (data.result) {
        Pinboard._userInfo.authToken = token;
        Pinboard._userInfo.name = token.split(':')[0];
        Pinboard._userInfo.isChecked = true;
        localStorage[namekey] = token.split(':')[0];
        localStorage[authTokenKey] = token;
        localStorage[checkedkey] = true;
      }
      done(data);
    }).fail(
      function (data) {
        fail(data);
      }
    );
  },
  logout: function (callback) {
    this._userInfo.isChecked = false;
    this._userInfo.name = '';
    this._userInfo.authToken = '';
    [checkedkey, namekey, pwdkey, authTokenKey, nopingKey].forEach(
      function (key) {
        localStorage.removeItem(key);
      }
    );
    callback();
  },
  isLoggedin: function () {
    return this._userInfo && this._userInfo.isChecked;
  },
  queryPinState: function (url, done, fail) {
    var path = mainPath + 'posts/get';
    var settings = {url: path,
                    type : 'GET',
                    data: {url: url, format: 'json',
                           auth_token: this._userInfo.authToken},
                    //timeout: REQ_TIME_OUT,
                    dataType: 'json',
                    crossDomain: true,
                    contentType:'text/plain'};
    $.ajax(settings).done(
      function (data) {
        done(data);
      }
    ).fail(
      function (data) {
        fail(data);
      }
    );
  },
  addPost: function (title, url, desc, tags, shared, toread, done, fail) {
    var path = mainPath + 'posts/add';
    var data = {description: title, url: url,
                extended: desc, tags: tags,
                shared: shared, toread: toread,
                auth_token: this._userInfo.authToken,
                format: 'json'};
    var settings = {url: path,
                    type : 'GET',
                    timeout: REQ_TIME_OUT,
                    dataType: 'json',
                    crossDomain: true,
                    data: data,
                    contentType:'text/plain'};
    $.ajax(settings).done(
      function (data) {
        done(data);
      }
    ).fail(
      function (data) {
        fail(data);
      }
    );
  },
  deletePost: function (url, done, fail) {
    var path = mainPath + 'posts/delete';
    var settings = {url: path,
                    type : 'GET',
                    timeout: REQ_TIME_OUT,
                    dataType: 'json',
                    crossDomain: true,
                    data: {
                      url: url, format: 'json',
                      auth_token: this._userInfo.authToken
                    },
                    contentType: 'text/plain'};
    $.ajax(settings).done(
      function (data) {
        done(data);
      }
    ).fail(
      function (data) {
        fail(data);
      }
    );
  },
  getSuggest: function (url, done) {
    var path = mainPath + 'posts/suggest';
    var settings = {url: path,
                    type : 'GET',
                    data: {
                      url: url, format: 'json',
                      auth_token: this._userInfo.authToken
                    },
                    timeout: REQ_TIME_OUT,
                    dataType: 'json',
                    crossDomain: true,
                    contentType:'text/plain'};
    $.ajax(settings).done(
      function (data) {
        done(data);
      }
    );
  },
  getTags: function (done) {
    var path = mainPath + 'tags/get';
    var settings = {url: path,
                    type : 'GET',
                    data: {auth_token: this._userInfo.authToken,
                           format: 'json'},
                    timeout: REQ_TIME_OUT,
                    dataType: 'json',
                    crossDomain: true,
                    contentType:'text/plain'};
    $.ajax(settings).done(
      function (data) {
        done(data);
      }
    );
  }
};
