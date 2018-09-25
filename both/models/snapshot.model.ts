export interface snapshot {
    _id?: string,
    reRunSearch?: boolean,
    selectedUser?: {
        my_requestprices?: {
            id?: string,
            email?: string,
            name?: string
        },
        my_submitprices?: {
            id?: string,
            email?: string,
            name?: string
        }
    }
}
