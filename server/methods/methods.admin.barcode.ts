import { Meteor } from 'meteor/meteor';
import { upcitemdb_upcSearch } from '../functions/functions.client.barcodeAPI';
import { ddpItemsInsertByAdmin } from '../functions/functions.admin.items';

import { Item } from '../../both/models/item.model';
import { Random } from 'meteor/random';

let Future = Npm.require( 'fibers/future' );

const request = require('request-promise');
const AWS = require('aws-sdk');

// s3 = Aws::S3::Client.new(http_wire_trace: true)
// const s3 = new AWS.S3();  // for Linux, Unix, and macOS users pick up defaut credential here -->  ~/.aws/credentials
const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    region: Meteor.settings.AWSRegion,
    aws_access_key_id: Meteor.settings.AWSAccessKeyId,
    aws_secret_access_key: Meteor.settings.AWSSecretAccessKey
});


Meteor.methods({
    
      /**
     * https://stackoverflow.com/questions/22186979/download-file-from-url-and-upload-it-to-aws-s3-without-saving-node-js?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa
     * meteor npm install --save request-promise
     * meteor npm install --save aws-sdk
     * 
     * https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-shared.html
     * Linux, Unix, and macOS users: ~/.aws/credentials
     * ww Lamba resize functions doesn't work when transferring file using s3.uppload(...) to S3Bucket
     * tt Transfer to a temp S3 bucket and run sync script from command line to transfer images form S3BucketTemp to S3Bucket - Lambda resize works here...
     */
    async uploadImageToTempS3Bucker(url, image) {
        // let url = 'https://www.google.com/images/srpr/logo11w.png';

        let options = {
            uri: url,
            encoding: null
        };
        // encoding: null
        // encoding: 'base64'
        // encoding: 'binary'
        // encoding: 'utf8'

        const body = await request(options)
        console.log(options);
        
        // Transfer to temp bucket -
        const uploadResult = await s3.upload({
          Bucket: Meteor.settings.S3BucketTemp,
          Key   : image,
          Body  : body,   
        }).promise()
        
    },


    /**
     * Check if an item with UPC already exist in MongoDB
     * WARNING - this methods adds item into MongoDB if it doesn't exist
     * 
     * @param barcode 
     */
    'testBarcode' (barcode) {
        check(barcode, Number);
        if ( (this.userId) && (Roles.userIsInRole(Meteor.userId(), 'superadmin')) ) {
            // confirm bacode doesn't already exist in system
            let res3 = Meteor.call('getItem', '', barcode);

            // Item exist in ZoJab's db 
            if (res3.length) {
                console.error('--- barcode exist ---' + barcode);
                return {
                    id: res3[0]._id,
                    name: res3[0].name,
                    status: true,
                    upc: barcode,
                    image: res3.image
                };
            }
            else {
                console.log('--- barcode DOES NOT exist ---' + barcode);
                let res3 = Meteor.call('barcodeTestOnly', barcode);
                console.log(res3);
                return {
                    id: null,
                    name: null,
                    status: false,
                    upc: barcode,
                    image: res3.image
                    
                }
            }
        }
    },


    /**
     * Check if an item with UPC already exist in MongoDB
     * WARNING - this methods adds item into MongoDB if it doesn't exist
     * 
     * @param barcode 
     */
    'checkIfUPCExistAlready' (barcode) {
        check(barcode, Number);
        if ( (this.userId) && (Roles.userIsInRole(Meteor.userId(), 'superadmin')) ) {
            // confirm bacode doesn't already exist in system
            let res3 = Meteor.call('getItem', '', barcode);

            // Item exist in ZoJab's db 
            if (res3.length) {
                console.error('--- barcode exist ---' + barcode);
                return {
                    id: res3[0]._id,
                    name: res3[0].name,
                    status: true,
                    upc: barcode,
                    image: res3.image
                };
            }
            else {
                console.log('--- barcode DOES NOT exist ---' + barcode);
                let res3 = Meteor.call('barcodeSearch', barcode);
                console.log(res3);
                return {
                    id: null,
                    name: null,
                    status: false,
                    upc: barcode,
                    image: res3.image
                    
                }
            }
        }
    },


    /**
     * 0) Enter UPCs from upcitemdb 
     * 1) Barcode search that calls upcitemdb API
     * 2) Transfer Image to temp S3Bucket
     * 3) Insert new item
     * 
     * @param barcode 
     */
    'barcodeSearch'(barcode) {
        check(barcode, Number);
        if ( (this.userId) && (Roles.userIsInRole(Meteor.userId(), 'superadmin')) ) {
                let owner = this.userId;
                let image =  'upcdb_' + Random.id(18) + '.png';
                
                let futureBC = new Future;

                upcitemdb_upcSearch(barcode, Meteor.bindEnvironment(function(err, products) {
                    let prod = JSON.parse( products.toString() );
                    console.log(prod.code + ' -- ' + prod.total );

                    let ni = <Item>{};                
                    ni.quantity = 1;     // this item is shared by all prices with different quantities
                    ni.public = 0;       // make public by default - allow community to flag item as inappropriate
                    ni.status = 0;       // set to active by default - only used for user submitted items
                    ni.created = new Date().getTime();
                    ni.owner = owner;

                    if (err) {
                        // ww UPC not found - skip Item Insert
                        console.error(err);
                        // X000TGBMC1 ==> { statusCode: 400,  W20170926-16:05:52.595(-7)? (STDERR)   data: '{"message":"The given upc is invalid","code":8002}' }
                        futureBC.return({
                            id: null,
                            name: 'UPC not found 11 - skip Item Insert',
                            status: false,
                            error: err
                        });
                    }
                    else {
                        if (prod.total) {
                                // UPC item found - store data
                                // console.log(prod.items[0].category);
                                // console.log(prod.items[0].size);
                                // console.error ( JSON.stringify(prod.items[0].size)  );
                                // console.log(prod.items[0].brand);
                                // console.log(prod.items[0].upc);
                                
                                // Add new item to mongoDB for later procsssing
                                ni._id =  Random.id();
                                ni.name = prod.items[0].title + ' :MANUALLY ADDED: ' + Random.id(18);
                                ni.upc = barcode;
                                ni.category = prod.items[0].category
                                ni.brand = prod.items[0].brand;
                                ni.model = prod.items[0].model;
                                ni.image2 = _.first(prod.items[0].images);
                                ni.size2 = prod.items[0].size;
                                ni.image = Meteor.settings.public.AWS_IMAGE_PATH + Meteor.settings.public.AWS_IMAGE_DEFAULT + image;

                                // Upload images to S3 by running script aws manually on my laptop - unable to get S3 transfer working
                                // let res3 = Meteor.call('uploadImageToTempS3Bucker', ni.image2 , image);
                                var dest = Meteor.settings.DOWNLOAD_DIR + image;

                                download(ni.image2 , dest, function(err){
                                    if(err){
                                    console.error(err);
                                    }else{
                                    console.log("Downloaded image: " + ni.image2);
                                    }
                                });

                                let res4 = ddpItemsInsertByAdmin(ni, false);
                                if (res4.status) {
                                    futureBC.return({
                                        status: true,
                                        name: ni.name,
                                        id: res4.id,
                                        image: image
                                    });
                                }
                                else {
                                    futureBC.return({
                                        id: null,
                                        name: 'Unable to insert item',
                                        status: false,
                                        error: 'Unable to insert item'
                                    });
                                }
                            }
                            else {
                                // ww UPC not found - skip Item Insert
                                console.error('UPC not found 22 - skip Item Insert: ' + barcode);
                                futureBC.return({
                                    id: null,
                                    name: 'UPC not found 22 - skip Item Insert',
                                    status: false,
                                    error: 'UPC not found 22 - skip Item Insert: ' + barcode
                                });
                            }
                        }
                }));

                return futureBC.wait();
        }            
    },

  
    /**
     * Used to test API
     * 
     * @param barcode 
     */
    'barcodeTestOnly'(barcode) {
        check(barcode, Number);
        if ( (this.userId) && (Roles.userIsInRole(Meteor.userId(), 'superadmin')) ) {
                console.log('!!------------- upcSearch ---------------' +  barcode);

                let futureBC = new Future;

                upcitemdb_upcSearch(barcode, Meteor.bindEnvironment(function(err, products) {
                    let prod = JSON.parse( products.toString() );
                    console.log(prod.code + ' -- ' + prod.total );

                    if (err) {
                        // ww UPC not found - skip Item Insert
                        console.error(err);
                        // X000TGBMC1 ==> { statusCode: 400,  W20170926-16:05:52.595(-7)? (STDERR)   data: '{"message":"The given upc is invalid","code":8002}' }
                        futureBC.return({
                            id: null,
                            name: 'UPC not found 11 - skip Item Insert',
                            status: false,
                            error: err
                        });
                    }
                    else {
                        if (prod.total) {
                                // UPC item found - store data
                                // console.log(prod.items[0].category);
                                // console.log(prod.items[0].size);
                                // console.error ( JSON.stringify(prod.items[0].size)  );
                                // console.log(prod.items[0].brand);
                                // console.log(prod.items[0].upc);
                                console.log(prod.items[0].title);
                                console.log(  _.first(prod.items[0].images)  );
                                
                                futureBC.return({
                                    upc: barcode,
                                    name: prod.items[0].title,
                                    category: prod.items[0].category,
                                    brand: prod.items[0].brand,
                                    model: prod.items[0].model,
                                    image: _.first(prod.items[0].images),
                                    status: true,
                                });
          
                            }
                            else {
                                // ww UPC not found - skip Item Insert
                                console.error('UPC not found 22 - skip Item Insert: ' + barcode);
                                futureBC.return({
                                    id: null,
                                    name: 'UPC not found 22 - skip Item Insert',
                                    status: false,
                                    error: 'UPC not found 22 - skip Item Insert: ' + barcode
                                });
                            }
                        }
                }));

                return futureBC.wait();
        }            
    },



    /**
     * https://github.com/awsdocs/aws-doc-sdk-examples/blob/master/javascript/example_code/s3/s3_upload.js
     * 
     */
    testingLoad_rev1() {
        // call S3 to retrieve upload file to specified bucket
        var fs = require('fs');
        var path = require('path');

        var uploadParams = {Bucket: Meteor.settings.S3Bucket, Key: '', Body: ''};
        var file = '/Users/cesargalindo/Downloads/PICS/pub27304_n.jpg';

        var fileStream = fs.createReadStream(file);
        fileStream.on('error', function(err) {
            console.log('File Error', err);
        });

        uploadParams.Body = fileStream;
        uploadParams.Key = path.basename(file);
        return;

        // call S3 to retrieve upload file to specified bucket
        s3.upload (uploadParams, function (err, data) {
            if (err) {
                console.log("Error", err);
            } if (data) {
                console.log("Upload Success", data.Location);
            }
        });
    },

});


function download(url, dest, callback) {
    var http = require('http');
    var fs = require('fs');

    var file = fs.createWriteStream(dest);
  
    var request = http.get(url, function (response) {
      response.pipe(file);
      file.on('finish', function () {
        file.close(callback); // close() is async, call callback after close completes.
      });
      file.on('error', function (err) {
        fs.unlink(dest); // Delete the file async. (But we don't check the result)
        if (callback)
          callback(err.message);
      });
  
    });
  }