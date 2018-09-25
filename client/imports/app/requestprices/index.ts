import { MyRequestpricesComponent } from './my-requestprices';
import { RequestpricesEditComponent } from './requestprices-edit';
import { RequestpricesCreatePComponent } from './requestprices-create-p';
import { RPScheduleCreateComponent } from './rp-schedule-create';
import { RPScheduleList } from './rp-schedule-list'

export const REQUEST_DECLARATIONS = [
    MyRequestpricesComponent,
    RequestpricesEditComponent,
    RequestpricesCreatePComponent,
    RPScheduleCreateComponent,
    RPScheduleList
];

import { RequestpricesService } from './requestprices.service';
export const REQUEST_PROVIDERS = [
    RequestpricesService,
];