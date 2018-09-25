import { Meteor } from 'meteor/meteor';
const mongo = require('mongodb');
const PayoutRequests = {
    async generateRandomPayouts() {
        const db = await mongo.MongoClient.connect(Meteor.settings.MONGO_URL);
        var prices = db.collection('prices')
        var oldPrices = await prices.find({}).toArray();
        console.log("---------Generating random payout amounts for " + oldPrices.length + " prices-------------");
        var newPrices = db.collection('prices_test');
        await newPrices.deleteMany({});
        for (let price of oldPrices) {
            price.payoutRequest = parseInt(Math.random() * 100.0)
            await newPrices.insertOne(price);
        }
        console.log("--------Done. Items saved to prices_test");
    }
}

export default PayoutRequests;