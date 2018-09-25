import { Meteor } from 'meteor/meteor';

// qq - Important: The fileRestrictions must be declared before the the directive is instantiated.
Slingshot.fileRestrictions("myFileUploads", {
    allowedFileTypes: ["image/png", "image/jpeg",  "image/jpg",  "image/gif"],
    maxSize: 5 * 1024 * 1024 // 5 MB (use null for unlimited).
});

Slingshot.createDirective("myFileUploads", Slingshot.S3Storage, {
    bucket: Meteor.settings.S3Bucket,
    region: Meteor.settings.AWSRegion,

    authorize: function () {
        //Deny uploads if user is not logged in.
        if (!this.userId) {
            var message = "Please login before posting files";
            throw new Meteor.Error("Login Required", message);
        }

        return true;
    },

    key: function (file) {
        //Store file into a directory by the user's username.
        return file.name;
    }
});