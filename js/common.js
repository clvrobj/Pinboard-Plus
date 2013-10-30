// userInfo: name, pwd, isChecked
var _userInfo = null, _tags = [], keyprefix = 'pbuinfo',
namekey = keyprefix + 'n', pwdkey = keyprefix + 'p', checkedkey = keyprefix + 'c',
nopingKey = keyprefix + 'np', // config in the settings for not checking page pin state
allprivateKey = keyprefix + 'allprivate', // config in the settings for always check the private checkbox
mainPath = 'https://api.pinboard.in/v1/',
yesIcon = '/img/icon_colored_19.png', noIcon = '/img/icon_grey_19.png', savingIcon = '/img/icon_grey_saving_19.png';
var REQ_TIME_OUT = 125 * 1000;
