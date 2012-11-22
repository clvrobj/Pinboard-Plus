// userInfo: name, pwd, isChecked
var _userInfo = null, _tags = [], keyprefix = 'pbuinfo',
namekey = keyprefix + 'n', pwdkey = keyprefix + 'p', checkedkey = keyprefix + 'c',
pingkey = keyprefix + 'g',
mainPath = 'https://api.pinboard.in/v1/',
yesIcon = 'icon_colored_19.png', noIcon = 'icon_grey_19.png', savingIcon = 'icon_grey_saving_19.png';
var REQ_TIME_OUT = 125 * 1000;

