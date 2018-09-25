# WANRING - This code base is intended for code reviews. It is not intended for production uses.

# ZoJab Angular2-Meteor-Base App - Admin

## Usage

Update settings-default.json file with appropriate information "keys, urls, etc."

The purpose of this Meteor App it to provide administration/operations functionality.
The Admin server makes DDP to the Client servers.  A listing of DDP calls reside in the methods.admin.ddp.ts file.

> meteor --settings settings-default.json --port 3500

To debug on server side:

> meteor --settings settings-default.json --port 3500 debug

Please note: by default, settings are available on server only. Settings values that will be used in client code must go inside the "public" block of your settings.json and can be accessed via Meteor.settings.public.KEY_NAME
See: http://stackoverflow.com/questions/15559743/meteor-client-side-s5ettings

IMPORTANT: DDP_URL must be set to the client server port.  For example if client app was launched with --port 4000 then DDP_URL setting should be:
"DDP_URL":  "http://localhost:4000/"


## Run locally, test remotely from any device (HTTP and HTTPS)

Start the app locally as described above, and verify that you can access it via localhost.

Then, open a terminal window and create a tunnel using ngrok:

> ./ngrok http 3500

The output from this command will consist of 2 URLs that forward requests to your local server, over HTTP and HTTPS. Works even if your local box is behind a firewall.


## Contents

This package contains:

- TypeScript support and Angular 2 compilers for Meteor
- Angular2-Meteor
- Angular2 (core, common, compiler, platform)
- Angular2 Material, SASS support
- Apollo GraphQL client side (requires Apollo Server)
- Testing framework with Mocha and Chai
- Meteor packages:  
    >  meteor list   
- NPM Packages:  
    > npm list
- ....

## Folder Structure

The folder structure is a mix between [Angular 2 recommendation](https://johnpapa.net/angular-2-styles/) and [Meteor recommendation](https://guide.meteor.com/structure.html).


#### Client

The `client` folder contains single TypeScript (`.ts`) file which is the main file (`/client/app.component.ts`), and bootstrap's the Angular 2 application.

The main component uses HTML template and SASS file.

The `index.html` file is the main HTML which loads the application by using the main component selector (`<app>`).

All the other client files are under `client/imports` and organized by the context of the components.


#### Server

The `server` folder contain single TypeScript (`.ts`) file which is the main file (`/server/main.ts`), and creates the main server instance, and the starts it.

All other server files should be located under `/server/imports`.

#### Common 

Example for common files in our app, is the MongoDB collection we create - it located under `/both` and it can be imported from both client and server code.

#### private

Contents in private directory is only accessible to server code

#### public

Contents in public directory is accessible to client 

## Testing TODO - minimal testing has been implemented.

# Install as a service (for remote Ubuntu instances, e.g. a droplet)
- If you followed the recommendation to install as root from your home folder, you will not need to edit zojab.service
- cp ./zojab.service /etc/systemd/system
- systemctl start zojab
- systemctl enable zojab

There is no output from the above command, to confirm that the service is running, use: 
- systemctl status zojab


## To fixe @agm/core bug
Add following to package.json in agm/core:
"main": "core.umd.js"
  