// Import our files
import { RemoteError } from './remote-error';
import { ErrorService } from '../services/error.service';
import { CommonUtilsService } from '../utils/common-utils.service';

export class InvalidRequestError extends RemoteError {
  private ERROR_SERVICE: ErrorService;
  private invalidParameters: string[];
  private unchangedParameters: string[];
  private hasInvalidParams: boolean = false;
  private hasUnchangedParams: boolean = false;

  constructor(_remoteError: RemoteError = new RemoteError()) {
    super(_remoteError.getLocalSource(), _remoteError.getRequestId(), _remoteError.getStatusCode());

    const commonUtilsService: CommonUtilsService = new CommonUtilsService();
    this.ERROR_SERVICE = new ErrorService(commonUtilsService);
    const errorMessage = this.getMessage() || '';
    if (/invalid/gi.test(errorMessage)) {
      this.hasInvalidParams = true;
      this.invalidParameters = this.ERROR_SERVICE.getInvalidParameters(this);
    } else if (/unchanged/gi.test(errorMessage)) {
      this.hasUnchangedParams = true;
      this.unchangedParameters = this.ERROR_SERVICE.getUnchangedParameters(this);
    }
  }
}
