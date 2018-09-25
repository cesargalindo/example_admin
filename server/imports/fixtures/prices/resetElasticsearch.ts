import { Meteor } from 'meteor/meteor';

/**
 * If no items found reset elastic search collections
 *
 * Make calls Synchronous
 */
export function resetElasticSearchPrices() {

    try {
        HTTP.call('GET', 'http://' + Meteor.settings.ELASTICSEARCH_URL + '/' + Meteor.settings.ES_INDEX_PRICES, {});

        // proceed in deleting existing index
        HTTP.call('DELETE', 'http://' + Meteor.settings.ELASTICSEARCH_URL + '/' + Meteor.settings.ES_INDEX_PRICES, {});
        console.log('DELETED Elastic environment: ' + 'http://' + Meteor.settings.ELASTICSEARCH_URL + '/' + Meteor.settings.ES_INDEX_PRICES);
    }
    catch (err) {
        console.log(err);
        // Index does not exist, there's no need to delete it.
    }

    // create index
    HTTP.call( 'PUT', 'http://' + Meteor.settings.ELASTICSEARCH_URL + '/' + Meteor.settings.ES_INDEX_PRICES, {
        data: {

            settings: {
                number_of_shards: 2,
                number_of_replicas: 0,
                analysis: {

                    tokenizer: {
                        autocomplete: {
                            type: "edge_ngram",
                            min_gram: 1,
                            max_gram: 10,
                            token_chars: [
                                "letter",
                                "digit",
                                "punctuation"
                            ]
                        }
                    },

                    analyzer: {
                        autocomplete: {
                            filter: ["stop", "lowercase", "snowball"],
                            tokenizer: "autocomplete"
                        }
                    }
                }
            },
            mappings: {
                prices: {
                    _all: {
                        "enabled": false
                    },
                    properties: {
                        name: {
                            type: "text",
                            analyzer: "autocomplete",
                            search_analyzer: "autocomplete",
                            fields: {
                                keyword: {
                                    type: "keyword",
                                    ignore_above: 256
                                }
                            }
                        },
                        id: {type: "keyword" },
                        itemId: {type: "keyword"},
                        storeId: {type: "keyword"},
                        price: {type: "half_float"},
                        payoutRequest: {type: "integer"},
                        quantity: {type: "integer"},
                        location: {type: "geo_point"},
                        gsize: { type: "float" },
                        gunit: { type: "keyword" },
                    }
                }
            }

        }
    });

    console.log('CREATED Elastic environment: ' + 'http://' + Meteor.settings.ELASTICSEARCH_URL + '/' + Meteor.settings.ES_INDEX_PRICES);
}


