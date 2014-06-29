// userInfo: name, pwd, isChecked
var _userInfo = null, _tags = [], keyPrefix = 'pbuinfo',
checkedkey = keyPrefix + 'c',
namekey = keyPrefix + 'n', pwdkey = keyPrefix + 'p',
authTokenKey = keyPrefix + '_auth_token',

// config in the settings for not checking page pin state
nopingKey = keyPrefix + 'np',
// config in the settings for always check the private checkbox
allprivateKey = keyPrefix + 'allprivate',
// config in the settings for wrapping text with <blockquote>
noblockquoteKey = keyPrefix + 'noblockquote',

mainPath = 'https://api.pinboard.in/v1/',

yesIcon = '/img/icon_colored_19.png',
noIcon = '/img/icon_grey_19.png',
savingIcon = '/img/icon_grey_saving_19.png';

var REQ_TIME_OUT = 125 * 1000, maxDescLen = 500;
