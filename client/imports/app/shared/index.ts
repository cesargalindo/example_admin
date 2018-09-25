import { DisplayNamePipe } from './display-name.pipe';
import { DisplayDistance } from './display-distance.pipe';
import { DisplayFormatDate, DisplayFormatDateSm, DisplayFormatDateNow, DisplayFormatTime } from './display-format-date.pipe';
import { DisplayDecimalDown, DisplayDecimalUp } from './display-decimal.pipe';
import { DisplayHours } from './display-hours.pipe';
import { DisplayRequestpriceStatus, DisplayPriceStatus, DisplaySubmitpriceStatus, DisplayItemStatus } from './display-status.pipe';
import { DisplayWithdrawalStatus, DisplayRequestStatus, DisplaySubmitStatus, DisplayScheduledStatus } from './display-status.pipe';
import { DisplayCount } from './display-count.pipe';
import { DisplayLargeImage } from './display-image.pipe';
import { SearchStoresComponent } from './search-stores/search-stores';
import { CustomCollapseComponent } from './custom-collapse/custom-collapse';
import { RankingComponent } from './ranking/ranking';
import { ReactiveMapComponent } from './mapping/reactive-map';
import { PlacesAutocomplete } from './mapping/places_autocomplete';
import { Request1SliderComponent } from './sliders/request1-slider';
import { TopToolbarComponent } from './top-toolbar/top-toolbar';

export const SHARED_DECLARATIONS: any[] = [
  DisplayNamePipe,
  DisplayDistance,
  DisplayFormatDateNow,
  DisplayFormatDate,
  DisplayFormatDateSm,
  DisplayFormatTime,
  DisplayDecimalDown,
  DisplayDecimalUp,
  DisplayHours,
  DisplayRequestpriceStatus,
  DisplayPriceStatus,
  DisplaySubmitpriceStatus,
  DisplayItemStatus,
  DisplayWithdrawalStatus,
  DisplayRequestStatus,
  DisplaySubmitStatus,
  DisplayScheduledStatus,
  DisplayCount,
  DisplayLargeImage,
  SearchStoresComponent,
  CustomCollapseComponent,
  RankingComponent,
  ReactiveMapComponent,
  Request1SliderComponent,
  TopToolbarComponent,
  PlacesAutocomplete
];
