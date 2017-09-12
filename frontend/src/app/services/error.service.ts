// Import angular packages
import {
  Headers,
  Response,
} from '@angular/http';
import { Injectable } from '@angular/core';

// Import our files
import { Error } from '../objects/error';
import { CommonUtilsService } from '../utils/common-utils.service';

@Injectable()
export class ErrorService {
  constructor(private _utils: CommonUtilsService) {}

  getError(_errorResponse: Response = new Response(null)) {
    // Get the error details from the response body
    const responseBody: Object = _errorResponse.json();
    const errorResponseDetails: Object = responseBody && responseBody['error'];

    // Create the error object from the response error details
    const error = new Error().deserialize(errorResponseDetails);

    /*
     * Get metadata from the response: 1) Request ID that the
     * API attached to the HTTP response. 2) The HTTP status code
     */
    const headers: Headers = _errorResponse.headers || new Headers();
    const requestId: string = headers.get('requestId');
    const statusCode: number = _errorResponse.status;

    // Add additional request information to the error object
    error.setRequestId(requestId);
    error.setStatusCode(statusCode);

    return error;
  }

  private splitParameters(_errorMessage: string = '', _splitRegex: string = ''): string[] {
    const _errorMessageSplit: string[] = _errorMessage.split(_splitRegex);
    const _paramsString: string = _errorMessageSplit.length >= 2 ? _errorMessageSplit[1] : '';
    const _params: string[] = _paramsString.split(',');

    return _params;
  }

  getInvalidParameters(_error: Error = new Error()): string[] {
    const errorMessage = _error.getMessage();
    const invalidParameters = this.splitParameters(errorMessage, 'Invalid parameters: ');

    return invalidParameters;
  }

  getUnchangedParameters(_error: Error = new Error()): string[] {
    const errorMessage = _error.getMessage();
    const unchangedParameters = this.splitParameters(errorMessage, 'Unchanged paramters: ');

    return unchangedParameters;
  }

  private isErrorType(_error: Error = new Error(), _preferredType: string): boolean {
    return _error.getType() === _preferredType;
  }

  isApiError(_error: Error = new Error()): boolean {
    return this.isErrorType(_error, 'api_error');
  }

  isAuthError(_error: Error = new Error()): boolean {
    return this.isErrorType(_error, 'authentication_error');
  }

  isMediaError(_error: Error = new Error()): boolean {
    return this.isErrorType(_error, 'invalid_media_type')
  }

  isInvalidRequestError(_error: Error = new Error()): boolean {
    return this.isErrorType(_error, 'invalid_request_error');
  }

  isLoginError(_error: Error = new Error()): boolean {
    return this.isErrorType(_error, 'login_error');
  }

  isResourceDneError(_error: Error = new Error()): boolean {
    return this.isErrorType(_error, 'resource_dne_error');
  }

  isResourceError(_error: Error = new Error()): boolean {
    return this.isErrorType(_error, 'resource_error');
  }
}
