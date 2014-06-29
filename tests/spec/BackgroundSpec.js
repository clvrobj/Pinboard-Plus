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
    });

    afterEach(function() {
        pages = {};
        jasmine.Ajax.uninstall();
    });

    it('log in should return', function () {
        var token = 'test_token';
        expect(login(token)).toBeUndefined();
        expect(jasmine.Ajax.requests.mostRecent().url).toContain(mainPath + 'user/api_token');
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

    it('add should be good', function () {
        var pageInfo = {url: 'http://twitter.com',
                       title: 'Twitter',
                       desc: '',
                       shared: true,
                       toread: false};
        expect(addPost(pageInfo)).toBeUndefined();
        expect(jasmine.Ajax.requests.mostRecent().url).toContain(mainPath + 'posts/add');
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
