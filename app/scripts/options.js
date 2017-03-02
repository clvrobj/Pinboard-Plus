$(function() {
  // localStorage only stores string values
  $('#no-ping').attr('checked', localStorage[nopingKey] === 'true').click(
    function () {
      var value = $(this).is(':checked');
      localStorage[nopingKey] = value;
    });

  $('#all-private').attr(
    'checked', localStorage[allprivateKey] === 'true').click(
    function () {
      var value = $(this).is(':checked');
      localStorage[allprivateKey] = value;
    });

  $('#private-when-incognito').attr(
    'checked', localStorage[privateWhenIncognitoKey] === 'true').click(
      function () {
        var value = $(this).is(':checked');
        localStorage[privateWhenIncognitoKey] = value;
      });

  $('#all-toread').attr(
    'checked', localStorage[alltoreadKey] === 'true').click(
      function () {
        var value = $(this).is(':checked');
        localStorage[alltoreadKey] = value;
      });

  $('#use-blockquote').attr('checked', isBlockquote()).click(
    function () {
      var value = $(this).is(':checked');
      localStorage[noblockquoteKey] = !value;
    });
});
