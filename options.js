$(function() {
      // localStorage only stores string values
      $('#no-ping').attr('checked', localStorage[nopingkey] === 'true')
          .click(function () {
                     var value = $(this).is(':checked');
                     localStorage[nopingkey] = value;
                 });
  });
