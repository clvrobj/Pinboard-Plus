describe("Test pinboard.js", function() {

  beforeEach(function() {
    jasmine.Ajax.install();
  });

  afterEach(function() {
    jasmine.Ajax.uninstall();
  });

  it('Login and logout', function () {
    var doneFn = jasmine.createSpy("success");
    var failFn = jasmine.createSpy("failed");

    var test_token = 'user:token';
    Pinboard.login(test_token, doneFn, failFn);

    jasmine.Ajax.requests.mostRecent().respondWith({
      "status": 200,
      "contenttype": 'text/plain',
      "responseText": JSON.stringify({result:'token'})
    });

    expect(doneFn).toHaveBeenCalledWith({result:'token'});

    var userInfo = Pinboard.getUserInfo();
    expect(userInfo.isChecked).toBe(true);
    expect(userInfo.authToken).toBe('user:token');
    expect(userInfo.name).toBe('user');
    expect(localStorage[checkedkey]).toEqual('true');
    expect(localStorage[namekey]).toEqual(userInfo.name);
    expect(localStorage[authTokenKey]).toEqual(userInfo.authToken);

    expect(Pinboard.isLoggedin()).toBe(true);

    // test logout
    var cbFn = jasmine.createSpy("cb");
    Pinboard.logout(cbFn);

    userInfo = Pinboard.getUserInfo();
    expect(userInfo.isChecked).toBe(false);
    expect(userInfo.authToken).toBe('');
    expect(userInfo.name).toBe('');
    expect(localStorage[namekey]).toBeUndefined();
    expect(localStorage[checkedkey]).toBeUndefined();
    expect(localStorage[authTokenKey]).toBeUndefined();
    expect(Pinboard.isLoggedin()).toBe(false);
  });

  it('Query post pinned or not base on url', function () {
    var doneFn = jasmine.createSpy("success");
    var failFn = jasmine.createSpy("failed");

    Pinboard.queryPinState('http://abc.xyz/', doneFn, failFn);

    var resp = {"date":"2017-02-28T05:34:12Z",
                "user":"user",
                "posts":[{"href":"http:\/\/abc.xyz\/",
                          "description":"id Software Programming Principles",
                          "extended":"",
                          "meta":"",
                          "hash":"",
                          "time":"2017-02-28T05:34:12Z",
                          "shared":"yes",
                          "toread":"no",
                          "tags":"programming development principle"}]};
    jasmine.Ajax.requests.mostRecent().respondWith({
      "status": 200,
      "contenttype": 'text/plain',
      "responseText": JSON.stringify(resp)
    });
    expect(doneFn).toHaveBeenCalledWith(resp);
  });

  it('Add post', function () {
    var doneFn = jasmine.createSpy("success");
    var failFn = jasmine.createSpy("failed");

    Pinboard.addPost('Title of the page',
                     'http://abc.xyz',
                     'Description text',
                     'programming development',
                     'yes',
                     'no',
                     doneFn, failFn);

    jasmine.Ajax.requests.mostRecent().respondWith({
      "status": 200,
      "contenttype": 'text/plain',
      "responseText": JSON.stringify({result_code:'done'})
    });
    expect(doneFn).toHaveBeenCalledWith({result_code:'done'});
  });

  it('Delete post', function () {
    var doneFn = jasmine.createSpy("success");
    var failFn = jasmine.createSpy("failed");

    Pinboard.deletePost(
      'http://abc.xyz/', doneFn, failFn
    );

    jasmine.Ajax.requests.mostRecent().respondWith({
      "status": 200,
      "contenttype": 'text/plain',
      "responseText": JSON.stringify({result_code:'done'})
    });
    expect(doneFn).toHaveBeenCalledWith({result_code:'done'});
  });

  it('Get suggest tags base on url', function () {
    var doneFn = jasmine.createSpy("success");

    Pinboard.getSuggest('http://abc.xyz/', doneFn);

    var resp = [{"popular":["twitter","facebook","objective-c","ifttt"]},
                {"recommended":["ifttt","twitter","facebook","WSH","objective-c","twitterlink","1960s","@codepo8","Aiviq","art"]}];
    jasmine.Ajax.requests.mostRecent().respondWith({
      "status": 200,
      "contenttype": 'text/plain',
      "responseText": JSON.stringify(resp)
    });
    expect(doneFn).toHaveBeenCalledWith(resp);
  });

  it('Get all tags of user', function () {
    var doneFn = jasmine.createSpy("success");

    Pinboard.getTags(doneFn);

    var resp = {"pinboard":"46", "github":"500", "fun":"53"};
    jasmine.Ajax.requests.mostRecent().respondWith({
      "status": 200,
      "contenttype": 'text/plain',
      "responseText": JSON.stringify(resp)
    });
    expect(doneFn).toHaveBeenCalledWith(resp);
  });

});
