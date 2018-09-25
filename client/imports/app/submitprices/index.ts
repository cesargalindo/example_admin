import { SubmitpricesCreatePComponent } from './submitprices-p';
import { SPScheduledCreateComponent } from  './sp-scheduled-create';
import { SPSubmittedComponent } from './sp-submitted';
import { SPScheduleList } from './sp-schedule-list';
import { SPRejectedComponent } from './sp-rejected';
import { SPClosedComponent } from './sp-closed';

export const SUBMIT_DECLARATIONS = [
    SubmitpricesCreatePComponent,
    SPScheduledCreateComponent,
    SPScheduleList,
    SPSubmittedComponent,
    SPRejectedComponent,
    SPClosedComponent
];


import { SubmitpricesService } from './submitprices-service';
export const SUBMIT_PROVIDERS = [
    SubmitpricesService,
];
