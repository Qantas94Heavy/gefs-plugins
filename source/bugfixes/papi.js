'use strict';

define([ 'util' ], function (util) {
  function papiBugfix() {
    // Make the angles used for PAPI more strict.  Assumes a 3 degree glideslope.
    var papiValues = [ 3.5, 19 / 6, 17 / 6, 2.5 ];

    function setPapi() {
      var collResult = geofs.getGroundAltitude(this.location[0], this.location[1]);
      this.location[2] = collResult.location[2];
      var relativeAicraftLla =
        [ geofs.aircraft.instance.llaLocation[0]
        , geofs.aircraft.instance.llaLocation[1]
        , this.location[2]
        ];

      var distance = geofs.utils.llaDistanceInMeters(
        relativeAicraftLla, this.location, this.location
      );

      var height = geofs.aircraft.instance.llaLocation[2] - this.location[2];
      var path = util.rad2deg(Math.atan2(height, distance));

      var lights = this.lights;
      papiValues.forEach(function (slope, i) {
        var belowAngle = path < slope;
        lights[i].red.setVisibility(belowAngle);
        lights[i].white.setVisibility(!belowAngle);
      });
    }

    geofs.fx.papi.prototype.refresh = function () {
      var that = this;
      this.papiInterval = setInterval(function () {
        setPapi.call(that);
      }, 1000);
    };

    // Remove old PAPI and replace with the new one.
    Object.keys(geofs.fx.litRunways).forEach(function (id) {
      var runway = geofs.fx.litRunways[id];

      // Stop old PAPI update function.
      clearInterval(runway.papiInterval);

      // Remove old PAPI lights.
      for (var i = 0; i < this.papis.length; i++) runway.papis[i].destroy();
      runway.papis = [];

      // Create new PAPI lights.
      var frame = M33.rotationZ(M33.identity(), runway.headingRad);
      var papiOffset = runway.widthMeters / 2 + 15;
      var papiStep, papiLocation;
      
      papiStep = xy2ll(V2.scale(b[0], 9), runway.threshold1),
      papiLocation = xy2ll(V2.scale(b[0], papiOffset), runway.threshold1);
      papiLocation = V2.add(runway.threshold1, papiLocation);
      papiLocation = V2.add(papiLocation, V2.scale(this.stepY, 5));
      this.addPapi(papiLocation, papiStep);

      papiStep = xy2ll(V2.scale(b[0], -9), runway.threshold2);
      papiLocation = xy2ll(V2.scale(b[0], -papiOffset), runway.threshold2);
      papiLocation = V2.add(runway.threshold2, papiLocation);
      papiLocation = V2.add(papiLocation, V2.scale(this.stepY, -5));
      this.addPapi(papiLocation, papiStep);
    });
  }

  return papiBugfix;
});
