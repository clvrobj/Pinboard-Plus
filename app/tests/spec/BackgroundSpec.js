describe("Test background", function() {

  beforeEach(function() {
    jasmine.Ajax.install();
    pages = {'http://zhangchi.de/':
             {desc:"Personal blog of zhangchi",
              isSaved: true,
              shared: true,
              tag: "blog",
              time: "2011-03-02T17:39:26Z",
              title: "zhangchi",
              toread: false,
              url: "http://zhangchi.de/"}};
    login('test_token');
    jasmine.Ajax.requests.mostRecent().respondWith({
      "status": 200,
      "contenttype": 'text/plain',
      "responseText": JSON.stringify({result:'token'})
    });
  });

  afterEach(function() {
    logout();
    pages = {};
    jasmine.Ajax.uninstall();
  });

  it('user info in should return', function () {
    expect(getUserInfo()).toBeDefined();
  });

  it('should return page info', function () {
    expect(getPageInfo('http://zhangchi.de/')).not.toBeNull();
  });

  it('should not return page info', function () {
    expect(getPageInfo('http://twitter.com')).toBeNull();
    expect(jasmine.Ajax.requests.mostRecent().url).toContain(mainPath + 'posts/get');
  });

  it('add post should be good', function () {
    var pageInfo = {url: 'http://twitter.com',
                    title: 'Twitter',
                    desc: '',
                    shared: true,
                    toread: false};
    expect(addPost(pageInfo)).toBeUndefined();
    expect(jasmine.Ajax.requests.mostRecent().url).toContain(mainPath + 'posts/add');
  });

  it('new tags should be add to the tags list', function () {
    _tags = ['pinboard', 'plus'];
    var pageInfo = {url: 'http://pinboard-plus.zhangchi.de/',
                    title: 'Pinboard Plus',
                    desc: '',
                    tag: 'pinboard plus pinboardplus',
                    shared: true,
                    toread: false};
    expect(addPost(pageInfo)).toBeUndefined();
    expect(_tags).toEqual(['pinboard', 'plus'].concat(['pinboardplus']));
  });

  it('delete should be good', function () {
    expect(deletePost('http://twitter.com')).toBeUndefined();
    expect(jasmine.Ajax.requests.mostRecent().url).toContain(mainPath + 'posts/delete');
  });

  it('get suggest should be good', function () {
    expect(getSuggest('http://twitter.com')).toBeUndefined();
    expect(jasmine.Ajax.requests.mostRecent().url).toContain(mainPath + 'posts/suggest');
  });

});
