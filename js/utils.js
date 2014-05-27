var isBlockquote = function () {
    var noBlockquote = localStorage[noblockquoteKey];
    return typeof noBlockquote == 'undefined' || noBlockquote === 'false';
};