import { Meteor } from 'meteor/meteor';

/**
 * If no items found reset elastic search collections
 *
 * Make calls Synchronous
 */
export function resetElasticSearchItems() {


    try {
        HTTP.call( 'GET', 'http://' + Meteor.settings.ELASTICSEARCH_URL + '/' + Meteor.settings.ES_INDEX_ITEMS, { });

        // proceed in deleting existing index
        HTTP.call( 'DELETE', 'http://' + Meteor.settings.ELASTICSEARCH_URL + '/' + Meteor.settings.ES_INDEX_ITEMS , { });
        console.log('DELETED Elastic environment: ' + 'http://' + Meteor.settings.ELASTICSEARCH_URL + '/' + Meteor.settings.ES_INDEX_ITEMS);
    }
    catch(err) {
        console.log(err);
        // Index does not exist, there's no need to delete it.
    }


    // create index
    HTTP.call( 'PUT', 'http://' + Meteor.settings.ELASTICSEARCH_URL + '/' + Meteor.settings.ES_INDEX_ITEMS, {
        data: {

            settings: {
                analysis: {
                    filter: {
                        my_stop : {
                            type : "stop",
                            stopwords: ["a", "at",
                                "b", "ba", "be", "bi", "bo", "bu", "by",
                                "c", "ca", "ce", "co", "cu", "ch", "cr",
                                "d", "da", "de", "di", "do", "du", "dh", "dr",
                                "e", "eb", "en", "ev",
                                "f", "fa", "fe", "fi", "fo", "fu", "fr",
                                "g", "ga", "ge", "gi", "go", "gu", "gr",
                                "h", "ha", "he", "hi", "ho", "hu",
                                "i", "il", "im", "in",
                                "j", "ja", "je", "ji", "jo", "ju",
                                "k", "ka", "ke", "ki", "ko", "ku",
                                "l", "la", "le", "li", "lo", "lu",
                                "m", "ma", "me", "mi", "mo", "mu",
                                "n", "na", "ne", "ni", "mo", "nu",
                                "o", "ob", "oc", "od", "on", "ot",
                                "p", "po", "pe", "pi", "po", "pu", "ph", "pr",
                                "q", "qa", "qe", "qi", "qo", "qu",
                                "r", "ra", "re", "ri", "ro", "ru",
                                "s", "sa", "se", "si", "so", "su",
                                "t", "ta", "te", "ti", "to", "tu", "th", "tr",
                                "u", "up",
                                "v", "va", "ve", "vi", "vo", "vu",
                                "w", "wa", "we", "wi", "wo", "wu", "wh", "wr",
                                "x", "xo",
                                "y", "ya", "ye", "yi", "yo", "yu",
                                "z", "za", "ze", "zi", "zo", "zu",
                                "and", "is", "the", "of", "that", "with", "my"]
                        },
                        snowball_en : {
                            type : "snowball",
                            language :"English"
                        },
                        autocomplete_filter: {
                            type:     "edge_ngram",
                            min_gram: 1,
                            max_gram: 20
                        }
                    },
                    analyzer: {
                        autocomplete: {
                            type:      "custom",
                            tokenizer: "whitespace",
                            filter: [
                                "lowercase",
                                "autocomplete_filter",
                                "snowball_en",
                                "my_stop"
                            ]
                        }
                    }
                }
            },

            mappings: {
                items: {
                    properties: {
                        id:   {
                            type:   "string",
                            index:  "not_analyzed" },
                        name: {
                            type:     "string",
                            analyzer: "autocomplete"
                        },
                        gunit:   {
                            type:   "string",
                            index:  "not_analyzed" },
                    }
                }
            }


        }
    });
    console.log('CREATED Elastic environment: ' + 'http://' + Meteor.settings.ELASTICSEARCH_URL + '/' + Meteor.settings.ES_INDEX_ITEMS);

}


