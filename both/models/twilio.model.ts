export interface Twilio {
    _id?: string;
    lock?: boolean;
    currentSMSCount?: number;
    totalSMSCount?: number;
    owner: string;
    lastSMSDate?: number;
    created: number;
    cells?: Array<CELL>;
    code?: number;
    verifyCount?: number;
    note?: string;
}

interface CELL {
    cellphone: string;
}