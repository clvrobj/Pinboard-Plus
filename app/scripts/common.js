// userInfo: name, pwd, isChecked
var _userInfo = null, _tags = [], keyPrefix = 'pbuinfo',
checkedkey = keyPrefix + 'c',
namekey = keyPrefix + 'n', pwdkey = keyPrefix + 'p',
authTokenKey = keyPrefix + '_auth_token',

// config in the settings for not checking page pin state
nopingKey = keyPrefix + 'np',
// config in the settings for always check the private checkbox
allprivateKey = keyPrefix + 'allprivate',
// config in the settings for always check the "to read" checkbox
alltoreadKey = keyPrefix + 'alltoread',
// config in the settings for wrapping text with <blockquote>
noblockquoteKey = keyPrefix + 'noblockquote',
// config in the settings for enabling 'private' when in incognito mode
privateWhenIncognitoKey = keyPrefix + 'privatewhenincognito',

mainPath = 'https://api.pinboard.in/v1/',

yesIcon = 'images/icon_color_16.png',
noIcon = 'images/icon_black_16.png',
savingIcon = 'images/icon_grey_saving_19.png';

var REQ_TIME_OUT = 125 * 1000, maxDescLen = 500;
