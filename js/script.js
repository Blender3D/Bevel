angular.module('bevel', [])
  .run(function($rootScope) {
    var arrow = {
      13: 'keyenter',
      27: 'keyescape',
      37: 'arrowleft',
      38: 'arrowup',
      39: 'arrowright',
      40: 'arrowdown'
    };

    $(document).on('wheel', function(event) {
      var delta = event.originalEvent.wheelDelta || event.which;
      delta && $rootScope.$apply(function() {
        $rootScope.$broadcast(delta > 0 ? 'scrollup' : 'scrolldown');
      });
    });

    $(document).on('keydown', function(event) {
      var name = arrow[event.which];
      name && $rootScope.$apply(function() {
        $rootScope.$broadcast(name);
      });
    });
  })
  .directive('contentShift', function() {
    function link(scope, element, attrs) {
      function update() {
        var when = attrs.contentWhen ? scope.$eval(attrs.contentWhen) : true;

        if (!when) {
          return $(element).css({
            left: 0,
            right: 0
          });
        }

        var shift = scope.$eval(attrs.contentShift);

        var children = $(element).children();
        var total = children.length, totalWidth = 0;
        children.each(function() {
          totalWidth += $(this).outerWidth(true);
        });

        var width = totalWidth / total;
        var offset = ((total / 2) - shift - 0.5) * width;
        $(element).css({
          left: offset,
          right: -offset
        });
      }

      attrs.contentWhen && scope.$watch(attrs.contentWhen, update);
      scope.$watch(attrs.contentShift, update);
      update();
    }

    return {
      restrict: 'A',
      link: link
    };
  })
  .directive('arrowStop', function() {
    function link(scope, element, attrs) {
      var arrow = {
        37: 'arrowleft',
        // 38: 'arrowup',
        39: 'arrowright',
        40: 'arrowdown'
      };

      $(element).on('keydown', function(event) {
        arrow[event.which] && event.stopPropagation();
      });
    }

    return {
      restrict: 'A',
      link: link
    };
  })
  .directive('focusWhen', function() {
    function link(scope, element, attrs) {
      var state = false;

      function update(focus) {
        // rising edge
        if (focus && (!state || focus !== state)) {
          setTimeout(element.focus.bind(element));
        }

        state = focus;
      }

      scope.$watch(attrs.focusWhen, update);
      update(scope.$eval(attrs.focusWhen));
    }

    return {
      restrict: 'A',
      link: link
    };
  })
  .controller('Users', function Users($scope, $timeout) {
    var palette = [
      '#FF6138',
      '#FFFF9D',
      '#BEEB9F',
      '#79BD8F',
      '#00A388'
    ];

    $scope.secret = '';
    $scope.authenticating = false;
    $scope.lightdm = lightdm;
    $scope.users = lightdm.users.map(function(user, index) {
      return {
        active: user.logged_in,
        color: palette[index % palette.length],
        image: user.image,
        name: user.display_name
      };
    });
    $scope.mode = null;
    $scope.selected = null;

    $scope.authComplete = function() {
      $scope.authenticating = false;

      if (lightdm.is_authenticated) {
        lightdm.login(lightdm.authentication_user, lightdm.default_session);
      } else {
        $timeout(function() {
          $scope.invalid = true;

          $timeout(function() {
            $scope.invalid = false;
          }, 3000);
        }, 300);
      }
    };

    $scope.submit = function() {
      lightdm.provide_secret($scope.secret);

      $scope.authenticating = true;
    };

    $scope.jump = function(index) {
      if ($scope.authenticating) return false;

      $scope.secret = '';

      if ($scope.mode === 'select' && $scope.selected === index) {
        $scope.mode = null;
        $scope.selected = null;
        return false;
      }

      if ($scope.mode === 'focus' && $scope.selected === index) {
        $scope.mode = 'select';
        return false;
      }

      $scope.mode || ($scope.mode = 'select');
      $scope.selected = index;
    };

    $scope.out = function() {
      if ($scope.authenticating) return false;

      $scope.secret = '';

      $scope.mode = null;
      $scope.selected = null;
    };

    $scope.up = function() {
      if ($scope.authenticating) return false;

      $scope.secret = '';

      if ($scope.mode === 'select')
        $scope.mode = 'focus';
      else if ($scope.mode === 'focus')
        $scope.out();
    };

    $scope.down = function() {
      if ($scope.authenticating) return false;

      $scope.secret = '';

      $scope.selected || ($scope.selected = 0);

      if (!$scope.mode)
        $scope.mode = 'focus';
      else if ($scope.mode === 'focus')
        $scope.mode = 'select';
    };

    $scope.left = function() {
      if ($scope.authenticating) return false;

      $scope.secret = '';

      if (!$scope.mode) {
        $scope.mode = 'focus';
        $scope.selected = 0;
      }

      if ($scope.selected <= 0)
        $scope.selected = $scope.users.length - 1;
      else
        $scope.selected--;
    };

    $scope.right = function() {
      if ($scope.authenticating) return false;

      $scope.secret = '';

      if (!$scope.mode) {
        $scope.mode = 'focus';
        $scope.selected = 0;
      } else if ($scope.selected >= $scope.users.length - 1) {
        $scope.selected = 0;
      } else {
        $scope.selected++;
      }
    };

    $scope.$on('arrowup', $scope.up);
    $scope.$on('keyenter', $scope.down);
    $scope.$on('keyescape', $scope.out);
    $scope.$on('scrollup', $scope.left);
    $scope.$on('arrowleft', $scope.left);
    $scope.$on('arrowdown', $scope.down);
    $scope.$on('scrolldown', $scope.right);
    $scope.$on('arrowright', $scope.right);
  });
