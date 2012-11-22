$(function() {
  // localStorage only stores string values
  $('#shouldPing').attr('checked', localStorage[pingkey] === 'true');
});

$(document).on('click', '#shouldPing', function() {
  var value = $(this).is(':checked');
  localStorage[pingkey] = value;
});
