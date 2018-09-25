export interface Vote {
    _id?: string;
    owner: string;
    submitterId: string;
    priceId: string;
    vote: number;       // -1 or 1  (thumbs down or thumbs up)
    voteId: number;     // 0 (thumbs up),  1 - wrong price, 2 - wrong desc, 3 - wrong image, 4 - request not fulfilled
    created: number;
    active: boolean;    // true - just added to thumbs up/down array, false - removed from thumbs up/down array
    note?: string;
}


