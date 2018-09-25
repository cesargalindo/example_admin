import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

export function loadUsers() {

    if (Meteor.users.find().count() === 0) {

        // Super Admin users
        let userInfo = Accounts.createUser({
            username: '0000000000',
            email: 'cesar@mutilo.com',
            password: 'mutilo11!!'
        });
        Roles.addUsersToRoles( userInfo, [ 'superadmin', 'contractor' ] );
        addCustomUserProfileFields(userInfo, 'Super', 'Admin', true, 'vv1');

        let userInfo = Accounts.createUser({
            username: '0000000001',
            email: 'henri@zojab.com',
            password: 'mutilo11!!',
        });
        Roles.addUsersToRoles( userInfo, [ 'superadmin', 'contractor' ] );
        addCustomUserProfileFields(userInfo, 'Henri', 'Pietila', true, 'vv2');

        let userInfo = Accounts.createUser({
            username: '0000000002',
            email: 'liang@theteam247.com',
            password: 'mutilo11!!',
        });
        Roles.addUsersToRoles( userInfo, [ 'superadmin', 'contractor' ] );
        addCustomUserProfileFields(userInfo, 'Liang', 'Huang', false, 'vv3');

        
        // Test accounts
        let userInfo = Accounts.createUser({
            username: '0000000003',
            email: 'cesar+1@mutilo.com',
            password: 'mutilo11',
        });
        Roles.addUsersToRoles( userInfo, [ 'contractor' ] );
        addCustomUserProfileFields(userInfo, 'Sub', 'AdminOne', true, 'vv4');

        let userInfo = Accounts.createUser({
            username: '0000000004',
            email: 'freelancer1@mutilo.com',
            password: 'FLcheck#8779',
        });
        Roles.addUsersToRoles( userInfo, [ 'contractor' ] );
        addCustomUserProfileFields(userInfo, 'Sub', 'AdminOne', true, 'vv5');

        let userInfo = Accounts.createUser({
            username: '0000000005',
            email: 'freelancer2@mutilo.com',
            password: 'FLcheck#1212',
        });
        Roles.addUsersToRoles( userInfo, [ 'contractor' ] );                
        addCustomUserProfileFields(userInfo, 'Sub', 'AdminTwo', true, 'vv6');

        let userInfo = Accounts.createUser({
            username: '0000000006',
            email: 'freelancer3@mutilo.com',
            password: 'FLcheck#7467',
        });
        Roles.addUsersToRoles( userInfo, [ 'contractor' ] );                
        addCustomUserProfileFields(userInfo, 'Sub', 'AdminTwo', true, 'vv7');

        let userInfo = Accounts.createUser({
            username: '0000000007',
            email: 'freelancer4@zojab.com',
            password: 'FLcheck#3267',
        });
        Roles.addUsersToRoles( userInfo, [ 'leadContractor' ] );        
        addCustomUserProfileFields(userInfo, 'Contractor', 'One', true, 'vv8');

        // Contractors
        let userInfo = Accounts.createUser({
            username: '0000000008',
            email: 'cdgalindo@yahoo.com',
            password: 'Pepe333###'
        });
        Roles.addUsersToRoles( userInfo, [ 'contractor' ] );        
        addCustomUserProfileFields(userInfo, 'Pepe', 'One', true, 'vv9');

        let userInfo = Accounts.createUser({
            username: '0000000009',
            email: 'esojseyer79@gmail.com',
            password: 'Pepe333###'
        });
        Roles.addUsersToRoles( userInfo, [ 'contractor' ] );        
        addCustomUserProfileFields(userInfo, 'Pepe', 'Two', true, 'vv10');

        let userInfo = Accounts.createUser({
            username: '0000000010',
            email: 'Pinaquis@hotmail.com',
            password: 'Pepe333###'
        });
        Roles.addUsersToRoles( userInfo, [ 'contractor' ] );        
        addCustomUserProfileFields(userInfo, 'Pepe', 'Three', true, 'vv11');

        let userInfo = Accounts.createUser({
            username: '0000000011',
            email: 'gvivian4424@gmail.com',
            password: 'Pepe333###'
        });
        Roles.addUsersToRoles( userInfo, [ 'contractor' ] );        
        addCustomUserProfileFields(userInfo, 'Pepe', 'Three', true, 'vv11');

        let userInfo = Accounts.createUser({
            username: '0000000012',
            email: 'alecto209@yahoo.com',
            password: 'Pepe333###'
        });
        Roles.addUsersToRoles( userInfo, [ 'contractor' ] );        
        addCustomUserProfileFields(userInfo, 'Pepe', 'Three', true, 'vv11');


        // Test Accounts Contractors
        let userInfo = Accounts.createUser({
            username: '0000000201',
            email: 'test+1@mutilo.com',
            password: 'MrZoJab1122'
        });
        Roles.addUsersToRoles( userInfo, [ 'contractor' ] );        
        addCustomUserProfileFields(userInfo, 'Test', 'One', true, 'vv11');

        let userInfo = Accounts.createUser({
            username: '0000000202',
            email: 'test+2@mutilo.com',
            password: 'MrZoJab1122'
        });
        Roles.addUsersToRoles( userInfo, [ 'contractor' ] );        
        addCustomUserProfileFields(userInfo, 'Test', 'One', true, 'vv11');

        let userInfo = Accounts.createUser({
            username: '0000000203',
            email: 'test+3@mutilo.com',
            password: 'MrZoJab1122'
        });
        Roles.addUsersToRoles( userInfo, [ 'contractor' ] );        
        addCustomUserProfileFields(userInfo, 'Test', 'One', true, 'vv11');

        let userInfo = Accounts.createUser({
            username: '0000000204',
            email: 'test+4@mutilo.com',
            password: 'MrZoJab1122'
        });
        Roles.addUsersToRoles( userInfo, [ 'contractor' ] );        
        addCustomUserProfileFields(userInfo, 'Test', 'One', true, 'vv11');

        let userInfo = Accounts.createUser({
            username: '0000000205',
            email: 'test+5@mutilo.com',
            password: 'MrZoJab1122'
        });
        Roles.addUsersToRoles( userInfo, [ 'contractor' ] );        
        addCustomUserProfileFields(userInfo, 'Test', 'One', true, 'vv11');

        let userInfo = Accounts.createUser({
            username: '0000000206',
            email: 'test+6@mutilo.com',
            password: 'MrZoJab1122'
        });
        Roles.addUsersToRoles( userInfo, [ 'contractor' ] );        
        addCustomUserProfileFields(userInfo, 'Test', 'One', true, 'vv11');

        let userInfo = Accounts.createUser({
            username: '0000000207',
            email: 'test+7@mutilo.com',
            password: 'MrZoJab1122'
        });
        Roles.addUsersToRoles( userInfo, [ 'contractor' ] );        
        addCustomUserProfileFields(userInfo, 'Test', 'One', true, 'vv11');

        let userInfo = Accounts.createUser({
            username: '0000000208',
            email: 'test+8@mutilo.com',
            password: 'MrZoJab1122'
        });
        Roles.addUsersToRoles( userInfo, [ 'contractor' ] );        
        addCustomUserProfileFields(userInfo, 'Test', 'One', true, 'vv11');


        // Test Accounts Contractors
        let userInfo = Accounts.createUser({
            username: '0000000299',
            email: 'raw+1@mutilo.com',
            password: 'rawmutilo11'
        });
        Roles.addUsersToRoles( userInfo, [ 'contractor' ] );        
        addCustomUserProfileFields(userInfo, 'Raw', 'One', true, 'vv11');

        // Test Accounts Contractors
        let userInfo = Accounts.createUser({
            username: '0000000298',
            email: 'raw+2@mutilo.com',
            password: 'rawmutilo11'
        });
        Roles.addUsersToRoles( userInfo, [ 'contractor' ] );        
        addCustomUserProfileFields(userInfo, 'Raw', 'Two', true, 'vv11');


        let userInfo = Accounts.createUser({
            username: '0000000310',
            email: 'agalindo101@yahoo.com',
            password: 'Andy33##'
        });
        Roles.addUsersToRoles( userInfo, [ 'contractor' ] );        
        addCustomUserProfileFields(userInfo, 'Raw', 'Two', true, 'vv11');

        let userInfo = Accounts.createUser({
            username: '0000000311',
            email: 'contactgalindo@gmail.com',
            password: 'Andy33##'
        });
        Roles.addUsersToRoles( userInfo, [ 'contractor' ] );        
        addCustomUserProfileFields(userInfo, 'Raw', 'Two', true, 'vv11');

    }

};


// add additional fields per Meteor guidelines - https://guide.meteor.com/accounts.html#adding-fields-on-registration
function addCustomUserProfileFields(userId, firstname, lastname, verfied, paypalId) {

    Meteor.users.update(userId, {
        $set: {
            userProfile: {
                firstname: firstname,
                lastname: lastname,
                paypalId: paypalId
            },
            cellVerified: verfied
        }
    });

}