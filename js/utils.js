var isUseBlockquote = function () {
    var noUseBlockquote = localStorage[nouseblockquoteKey];
    return typeof noUseBlockquote == 'undefined' || noUseBlockquote === 'false';
};