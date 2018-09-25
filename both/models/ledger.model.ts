export interface Ledger {
    _id?: string;
    pendingRequests?: number;
    pendingSubmits?: number;
    requests: number;
    balance: number;
    owner: string;
    updated: number;
    created: number;
    totalDeposit?: number;
    totalWithdrawn?: number;
    note?: string;
}
