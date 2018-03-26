// Created by Derrick Cohodas (dav-)
// Based on the Python example by StackExchange user wwnick from http://gis.stackexchange.com/a/415/41129 


// Requires the Mathjs library - http://mathjs.org/
//var math = require('mathjs')

/**
 * Represents a coordinate with a distance
 * @param {Number} lat  Latitude
 * @param {Number} lon  Longitude
 * @param {Number} dist Distance from [lat, lon] to some point in kilometers
 */
var Beacon = function(lat, lon, dist) {
  this.lat  = lat
  this.lon  = lon
  this.dist = dist

  return this
}

/**
 * Perform a trilateration calculation to determine a location
 * based on 3 beacons and their respective distances (in kilometers) to the desired point.
 *
 * @param  {Array} beacons Array of 3 Beacon objects
 * @return {Array}         Array of the format [latitude, longitude]
 */
var trilaterate = function(beacons) {

  // #assuming elevation = 0
  var earthR = 6371
    , rad = function(deg) {
      return deg * (math.pi/180)
    }
    , deg = function(rad) {
      return rad * (180/math.pi)
    }

  // #using authalic sphere
  // #if using an ellipsoid this step is slightly different
  // #Convert geodetic Lat/Long to ECEF xyz
  // #   1. Convert Lat/Long to radians
  // #   2. Convert Lat/Long(radians) to ECEF
  var P1 = [ earthR *(math.cos(rad(beacons[0].lat)) * math.cos(rad(beacons[0].lon)))
           , earthR *(math.cos(rad(beacons[0].lat)) * math.sin(rad(beacons[0].lon)))
           , earthR *(math.sin(rad(beacons[0].lat)))
           ]

  var P2 = [ earthR *(math.cos(rad(beacons[1].lat)) * math.cos(rad(beacons[1].lon)))
           , earthR *(math.cos(rad(beacons[1].lat)) * math.sin(rad(beacons[1].lon)))
           , earthR *(math.sin(rad(beacons[1].lat)))
           ]

  var P3 = [ earthR *(math.cos(rad(beacons[2].lat)) * math.cos(rad(beacons[2].lon)))
           , earthR *(math.cos(rad(beacons[2].lat)) * math.sin(rad(beacons[2].lon)))
           , earthR *(math.sin(rad(beacons[2].lat)))
           ]

  // #from wikipedia
  // #transform to get circle 1 at origin
  // #transform to get circle 2 on x axis
  var ex = math.divide(math.subtract(P2, P1), math.norm( math.subtract(P2, P1) ))
  var i =  math.dot(ex, math.subtract(P3, P1) )

  var ey = math.divide(
          math.subtract(
            math.subtract(P3, P1),
            math.multiply(i, ex)
          ),
          math.norm(
            math.subtract(
              math.subtract(P3, P1),
              math.multiply(i, ex)
            )
          )
       )

  var ez = math.cross(ex, ey)
  var d =  math.norm(math.subtract(P2, P1))
  var j =  math.dot(ey, math.subtract(P3, P1))

  // #from wikipedia
  // #plug and chug using above values
  var x =  (math.pow(beacons[0].dist, 2) - math.pow(beacons[1].dist,2) + math.pow(d,2))/(2*d)
  var y = ((math.pow(beacons[0].dist, 2) - math.pow(beacons[2].dist,2) + math.pow(i,2) + math.pow(j,2))/(2*j)) - ((i/j)*x)

  // # only one case shown here
  //
  // I was having problems with the number in the radical being negative,
  // so I took the absolute value. Not sure if this is always going to work
  var z = math.sqrt( math.abs(math.pow(beacons[0].dist, 2) - math.pow(x, 2) - math.pow(y, 2)) )

  // #triPt is an array with ECEF x,y,z of trilateration point
  var triPt = math.add(
            math.add(
              math.add(P1,
                math.multiply(x, ex)
              ),
              math.multiply(y, ey)
            ),
            math.multiply(z, ez)
          )

  // #convert back to lat/long from ECEF
  // #convert to degrees
  var lat = deg(math.asin(math.divide(triPt[2], earthR)))
  var lon = deg(math.atan2(triPt[1], triPt[0]))

  return [lat, lon]

}
