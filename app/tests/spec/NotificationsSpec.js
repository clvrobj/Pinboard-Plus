describe("Test notifications", function() {

  beforeEach(function() {
    Notifications.init();
    Notifications.clearAll();
  });

  afterEach(function() {
    Notifications.clearAll();
  });

  it('init', function () {
    expect(Notifications.getTop()).toBe(null);
  });

  it('add notification', function () {
    var firstNoti = {message:'First notify', type:'error'};
    var secNoti = {message:'Second notify', type:'info'};
    var thirdNoti = {message:'Third notify', type:'success'};

    Notifications.add(firstNoti.message, firstNoti.type);
    expect(Notifications.getTop().message).toBe(firstNoti.message);
    expect(Notifications.getTop().type).toBe(firstNoti.type);
    expect(Notifications.notis.length).toBe(1);

    Notifications.add(secNoti.message, secNoti.type);
    expect(Notifications.getTop().message).toBe(secNoti.message);
    expect(Notifications.getTop().type).toBe(secNoti.type);
    expect(Notifications.notis.length).toBe(2);

    Notifications.add(thirdNoti.message, thirdNoti.type);
    expect(Notifications.getTop().message).toBe(thirdNoti.message);
    expect(Notifications.getTop().type).toBe(thirdNoti.type);
    expect(Notifications.notis.length).toBe(3);
  });

  it('default type add notification', function () {
    // test default value of type param
    var defaultType = 'error';
    Notifications.add('notify with default type');
    expect(Notifications.getTop().type).toBe(defaultType);
  });

  it('add duplicate notification', function () {
    var no1Noti = {message:'No. 1 notify', type:'error'};
    var no2Noti = {message:'No. 2 notify', type:'error'};

    for (var i = 0; i < 3; i++) {
      Notifications.add(no1Noti.message, no1Noti.type);
    }
    expect(Notifications.getTop().message).toBe(no1Noti.message);
    expect(Notifications.getTop().type).toBe(no1Noti.type);
    expect(Notifications.notis.length).toBe(1);

    Notifications.add(no2Noti.message, no2Noti.type);
    Notifications.add(no1Noti.message, no1Noti.type);
    expect(Notifications.getTop().message).toBe(no1Noti.message);
    expect(Notifications.getTop().type).toBe(no1Noti.type);
    expect(Notifications.notis.length).toBe(2);

    Notifications.add(no2Noti.message, no2Noti.type);
    expect(Notifications.getTop().message).toBe(no2Noti.message);
    expect(Notifications.getTop().type).toBe(no2Noti.type);
    expect(Notifications.notis.length).toBe(2);
  });

  it('remove notification', function () {
    var cnt = 5;
    for (var i = 0; i < cnt; i++) {
      Notifications.add(i + ' notify', 'error');
    }
    expect(Notifications.notis.length).toBe(cnt);

    var p = cnt;
    for (i = 0; i < cnt - 1; i++) {
      Notifications.remove();
      expect(Notifications.notis.length).toBe(cnt - i - 1);
      expect(Notifications.getTop().message).toBe((cnt - i - 2) + ' notify');
    }
    // remove the last one
    Notifications.remove();
    expect(Notifications.notis.length).toBe(0);
    expect(Notifications.getTop()).toBe(null);
  });

  it('clear all', function () {
    var cnt = 5;
    for (var i = 0; i < cnt; i++) {
      Notifications.add(i + 'notify', 'error');
    }
    expect(Notifications.notis.length).toBe(cnt);

    Notifications.clearAll();
    expect(Notifications.getTop()).toBe(null);
    expect(Notifications.notis.length).toBe(0);

    Notifications.add('notify again', 'error');
    expect(Notifications.getTop().message).toBe('notify again');
  });

});
