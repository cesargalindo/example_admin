import { ElasticSearchService } from './ElasticSearchService';
import { SingleCollectionService } from './SingleIdCollection.data.service';
import { VariablesService } from './VariablesService';
import { ValidatorsService } from './ValidatorService';
import { CacheStateService } from './CacheStateService';
import { SnackbarService } from './SnackbarService';
import { UserService } from './UserService';
// import { SocketClientService } from './SocketClientService';
import { LocationTrackingService } from './LocationTrackingService';
import { SearchHistoryService } from './SearchHistoryService';
import { MiscService } from './MiscService';

export const SERVICES_PROVIDERS = [
    ElasticSearchService,
    SingleCollectionService,
    VariablesService,
    ValidatorsService,
    CacheStateService,
    SnackbarService,
    UserService,
    // SocketClientService,
    LocationTrackingService,
    SearchHistoryService,
    MiscService
];
