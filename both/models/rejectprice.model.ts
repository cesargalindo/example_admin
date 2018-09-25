export interface RejectPrice {
    _id?: string;
    rpId: string;
    spId: string;
    submitted: number;		// timestamp - same as created
    updated: number;		// timestamp
    status: string;         // rejected, disputed (case manager must review - need to define process), resolved ( money is given back)
    note?: string;
}

