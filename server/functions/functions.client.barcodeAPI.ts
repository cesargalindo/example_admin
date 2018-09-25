/**
 * http://www.upcitemdb.com/wp/docs/main/development/getting-started/
 *
 */
const https = require('https')

/**
 * Trial API Call - Developer - Free
 * 
 * @param barcode 
 * @param cb 
 */
export function upcitemdb_upcSearch(barcode, cb) {
  var opts = {
    hostname: 'api.upcitemdb.com',
    path: '/prod/trial/lookup', 
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
    }
  }
  var req = https.request(opts, function(res) {
    console.log('statusCode: ', res.statusCode);
    res.on('data', function(d) {
      cb(null, d);
    })
  })
  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
    cb(e, null);    
  })
  
  req.write('{ "upc": "' + barcode + '" }')
  req.end()
}

/**
 * Paid API call
 * 
 * @param barcode 
 * @param cb 
 */
export function upcitemdb_upcSearch_PAID(barcode, cb) {
  var opts = {
    hostname: 'api.upcitemdb.com',
    path: '/prod/v1/lookup',
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      "user_key": Meteor.settings.upcitemdb.user_key,
      "key_type": "3scale"
    }
  }
  var req = https.request(opts, function(res) {
    console.log('statusCode: ', res.statusCode);
    res.on('data', function(d) {
      cb(null, d);
    })
  })
  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
    cb(e, null);    
  })
  
  req.write('{ "upc": "' + barcode + '" }')
  req.end()
}

