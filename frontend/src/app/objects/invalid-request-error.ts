// Import our files
import { RemoteError } from './remote-error';
import { ErrorService } from '../services/error.service';

export class InvalidRequestError extends RemoteError {
  private invalidParameters: string[];
  private unchangedParameters: string[];
  private hasInvalidParams: boolean = false;
  private hasUnchangedParams: boolean = false;
  private errorService: ErrorService;

  constructor(_remoteError: RemoteError = new RemoteError()) {
    super(_remoteError.getLocalSource(), _remoteError.getRequestId(), _remoteError.getStatusCode());

    this.errorService = new ErrorService();
    const errorMessage = this.getMessage() || '';
    if (/invalid/gi.test(errorMessage)) {
      hasInvalidParams = true;
      this.invalidParameters = this.errorService.getInvalidParameters(this);
    } else if (/unchanged/gi.test(errorMessage)) {
      hasUnchangedParams = true;
      this.unchangedParameters = this.errorService.getUnchangedParameters(this);
    }
  }
}
