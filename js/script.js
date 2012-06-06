$(document).ready(function() {
  window.authentication_complete = function () {
    if (lightdm.is_authenticated) {
      lightdm.login(lightdm.authentication_user, lightdm.default_session);
    } else {
      $('.user.active label').text('Invalid password, please try again')
    }
  }

  var $user_list = $('#user-list');
  var palette = [
    '#FF6138',
    '#FFFF9D',
    '#BEEB9F',
    '#79BD8F',
    '#00A388',
  ];

  for (i in lightdm.users) {
    var user = lightdm.users[i];
    var $entry = $('<div />', {class: 'user'});

    $entry.data('user', user);
    user.background = '/home/' + user.name + '/.background';
    
    if (!user.image.length) {
      user.image = 'images/stock_person.svg';
    }

    $('<div />', {class: 'left-bubble'}).css({backgroundColor: palette[i]}).appendTo($entry);
    $('<img />', {src: user.image, class: 'user-image'}).appendTo($entry);
    var $username = $('<div />', {class: 'user-name'}).text(user.display_name).appendTo($entry);

    if (user.logged_in) {
      $('<span />', {class: 'user-logged-in'}).text('(logged in)').appendTo($username);
    }

    $('<label />').text('Enter your password').appendTo($entry);
    $('<input />', {type: 'password'}).appendTo($entry);

    $entry.appendTo($user_list);
  }

  $('.system-button').each(function(index) {
    $(this).css('background-color', palette[index]);

    if (!lightdm['can_' + $(this).text().toLowerCase()]) {
      $(this).hide();
    }
  });

  $('.system-button').on('click', function() {
    return lightdm[$(this).text().toLowerCase()]();
  })

  $('.user .user-name, .user .left-bubble').on('click', function(e) {
    var $this = $(this).parents('.user');
    var user = $this.data('user');

    lightdm.cancel_timed_login();
    lightdm.start_authentication(user.name);

    if ($this.hasClass('active')) {
      setTimeout(function() {
        $this.find('input').val('');
        $this.find('label').text('Enter your password')
      }, 300);

      return $this.removeClass('active');
    }

    $this.addClass('active').siblings().each(function() {
      $(this).removeClass('active');
      $(this).find('input').val('');
      $(this).find('label').text('Enter your password');
    });

    setTimeout(function() {
      $this.find('input').focus();
    }, 300);
  });

  $('.user input').on('keyup', function(e) {
    if (e.keyCode != 13) {
      return;
    }

    var $this = $(this).parents('.user');
    var user = $this.data('user');
    
    lightdm.provide_secret($(this).val());

    $this.find('label').text('Authenticating...');
  });

  /*
  var $background = $('<img />', {src: $('.user').eq(0).data('user').background, id: 'background'}).appendTo('body');
  $background.css({
    left: ($background.width() - $(window).width()) / 2,
    top: ($background.height() - $(window).height()) / 2
  });
  */
  
  $('#hostname').text(lightdm.hostname);

  $('body').animate({'opacity': '1'});
});