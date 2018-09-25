/**
 * Collection of Favorate Items and Store unique to each user "owner"
 */
export interface Favorite {
    owner: string;
    favItems?: Array<FAVITEM>;
    favStores?: Array<FAVSTORE>;
}

interface FAVITEM {
    id: string;
    created: number;   // timestamp    
}

interface FAVSTORE {
    id: string;
    created: number;   // timestamp    
}