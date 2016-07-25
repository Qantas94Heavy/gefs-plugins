'use strict';

define(function () {
  var sin = Math.sin;
  var cos = Math.cos;
  var tan = Math.tan;
  
  var abs = Math.abs;
  var log = Math.log;
  var pi = Math.PI;
  var twoPi = 2 * pi;
  
  var radToDegrees = 180 / pi;
  var degreesToRad = pi / 180;
  
  // distance between aircraft and reference point on desired path in NM
  var L1 = 2;
  
  // average radius of Earth (WGS84)
  var R1 = 6371008.7714;
  
  // distance from 
  var d = 4;
  
  // radians
  var angularDistance = distance / R1;
  var latitude = latDeg * degreesToRad;
  var longitude = lonDeg * degreesToRad;
  var θ = heading * degreesToRad;

  var deltaLatitude = angularDistance * cos(θ);
  var newLatitude = latitude + deltaLatitude;
  
  // check for some daft bugger going past the pole, normalise latitude if so
  if (newLatitude > pi / 2) newLatitude = pi - newLatitude;
  else if (newLatitude < -pi / 2) newLatitude = -pi - newLatitude;

  // tangential angle?
  var Δψ = arcsinh(tan(newLatitude)) - arcsinh(tan(latitude));
  var Δψ = log(tan(newLatitude / 2 + pi / 4)) - log(tan(latitude / 2 + pi / 4));
  
  // E-W course becomes ill-conditioned with 0/0
  var q = abs(Δψ) > 10e-12 ? deltaLatitude / Δψ : cos(latitude); 

  var deltaLongitude = angularDistance * sin(θ) / q;

  // normalise to =/- 180 degrees
  var newLongitude = ((longitude + deltaLongitude + 3 * pi) % twoPi) - pi;

  return [ newLatitude * radToDegrees, newLongitude * radToDegrees ];
});