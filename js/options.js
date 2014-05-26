$(function() {
      // localStorage only stores string values
      $('#no-ping').attr('checked', localStorage[nopingKey] === 'true')
          .click(function () {
                     var value = $(this).is(':checked');
                     localStorage[nopingKey] = value;
                 });
      $('#all-private').attr('checked', localStorage[allprivateKey] === 'true')
          .click(function () {
                     var value = $(this).is(':checked');
                     localStorage[allprivateKey] = value;
                 });
      $('#use-blockquote').attr('checked', localStorage[useblockquoteKey] === 'true')
          .click(function () {
                     var value = $(this).is(':checked');
                     localStorage[useblockquoteKey] = value;
                 });
  });
