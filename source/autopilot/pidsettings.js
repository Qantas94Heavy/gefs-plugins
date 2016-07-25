'use strict';

define(
{ a380:
  { climb:
    { kp: 0.01
    , ti: 0.05
    , td: 0.005
    , min: -10
    , max: 10
    }
  , pitch:
    { kp: 0.02
    , ti: 0.1
    , td: 0.005
    }
  , roll:
    { kp: 0.02
    , ti: 0.01
    , td: 0.01
    }
  , throttle:
    { kp: 0.015
    , ti: 0.4
    , td: 0.1
    }
  }
});
