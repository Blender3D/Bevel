$(document).ready(function() {
  var authenticating = false;

  window.authentication_complete = function () {
    authenticating = false;
    $('#password').removeAttr('disabled');

    if (lightdm.is_authenticated) {
      lightdm.login(lightdm.authentication_user, lightdm.default_session);
    } else {
      $('#authentication-message').removeClass('active');

      setTimeout(function() {
        $('#authentication-message').text('Invalid password').addClass('active error');

        setTimeout(function() {
          $('#authentication-message').removeClass('active error');
        }, 3000);
      }, 300);
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
    
    var $bubble = $('<div />', {class: 'bubble'}).css({backgroundColor: palette[i]}).appendTo($entry);
    var $username = $('<div />', {class: 'user-name'}).text(user.display_name).appendTo($entry);

    if (user.logged_in) {
      $('<span />', {class: 'user-logged-in'}).text('logged in').appendTo($entry);
      $entry.addClass('logged-in');
    }

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

  $('.user').on('click', function(event, navigate) {
    if (authenticating) return false;

    var navigate = typeof navigate === 'undefined' ? 0 : navigate;

    var $this = $(this);
    var user = $this.data('user');

    lightdm.cancel_timed_login();
    lightdm.start_authentication(user.name);

    if (navigate == 0 && $this.hasClass('active') && $('#password-container').hasClass('hidden')) {
      $('#password-container').removeClass('hidden');

      return false;
    }

    if (navigate == 3 && !$('#password-container').hasClass('hidden')) {
      $('#password-container').addClass('hidden');

      return false;
    }

    if (navigate != 2 && $this.hasClass('active')) {
      if (navigate != 1 && !$('#password-container').hasClass('hidden')) {
        $('#password-container').addClass('hidden');
      }

      $('#user-list').css({
        left: 0,
        right: 0
      });

      $this.parent().children().removeClass('hidden active');

      return false;
    }

    var index = $this.index() + 1;
    var total = $this.siblings().length + 1;
    var shift = ((total + 1) / 2 - index) * $this.outerWidth(true);

    $('#user-list').css({
      left: shift,
      right: -shift
    });

    $this.parent().children().addClass('hidden').removeClass('active');
    $this.addClass('active').removeClass('hidden');

    if (navigate != 1) {
      $('#password-container').removeClass('hidden').find('input').val('').focus();
    }
  });

  $('#password').on('keyup', function(e) {
    if (e.keyCode != 13) {
      return;
    }

    lightdm.provide_secret($(this).val());

    authenticating = true;

    $('#authentication-message').removeClass('error').text('Authenticating...').addClass('active');
    $('#password').attr('disabled', 'disabled');
  });

  $(document).on('keydown mousewheel', function(e) {
    if (authenticating) return false;
    
    var arrow = {left: 37, up: 38, right: 39, down: 40};
    var users = $('#user-list .user');
    var current = $('#user-list .active');
    var index = Math.max(current.index(), 0);
    
    switch (e.originalEvent.wheelDelta || e.which) {
      case 120:
      case arrow.left:
        if (current.length == 0) {
          index = 1;
        } else if (index == 0) {
          break;
        }

        users.eq(index - 1).trigger('click', [1]);
        $('#password').val('');
        break;

      case -120:
      case arrow.right:
        if (index == users.length - 1) break;

        users.eq(index + 1).trigger('click', [1]);
        $('#password').val('');
        break;

      case arrow.up:
        if (current.length == 0) break;

        current.trigger('click', [3]);
        break;

      case arrow.down:
        if (current.length == 0) {
          users.eq(index).trigger('click', [1]);
        } else {
          users.eq(index).trigger('click', [2]);
        }
        
        break;
    }
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