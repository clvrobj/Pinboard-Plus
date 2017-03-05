var Notifications = {
  init : function () {
    var strNotis = localStorage['notifications'];
    if (strNotis) {
      this.notis = JSON.parse(strNotis);
    } else {
      this.notis = [];
    }
  },
  findNotification: function (messageKey) {
    for (var i=0; i < this.notis.length; i++) {
      if (this.notis[i].message === messageKey) {
            return i;
        }
    }
    return -1;
  },
  add: function (message, type) {
    type = typeof type !== 'undefined' ? type : 'error';
    // find if there is the item exists
    var ind = this.findNotification(message);
    if (ind >= 0) {
      // to put the dup item to the top
      this.notis.splice(ind, 1);
    }
    this.notis.push({message:message, type:type});
    localStorage['notifications'] = JSON.stringify(this.notis);
  },
  remove: function () {
    if (this.notis && this.notis.length) {
      this.notis.splice(-1,1);
      localStorage['notifications'] = JSON.stringify(this.notis);
    }
  },
  getTop: function () {
    return this.notis.length ? this.notis[this.notis.length - 1] : null;
  },
  clearAll: function () {
    this.notis = [];
    localStorage.removeItem('notifications');
  }
};
