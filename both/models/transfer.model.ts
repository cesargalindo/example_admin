// step 1 - new item - requires fixing of Info - transferred from submitter to lead
// step 2 - items fixed by lead contractor - transferred to lead to admin
// step 3 - items published - pushed live to system
// payment - 1 - pending, 2 - paid/closed - refers to ownerFrom
export interface Transfer {
    _id?: string;
    ownerFrom: string;
    ownerTo: string;
    items?: number;
    prices?: number;    
    created: number;
    status: number;
    payment: number;
    note?: string;
}
