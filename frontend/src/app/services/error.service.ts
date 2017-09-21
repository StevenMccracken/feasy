// Import angular packages
import {
  Headers,
  Response,
} from '@angular/http';
import { Injectable } from '@angular/core';

// Import 3rd-party libraries
import 'rxjs/add/operator/map';

// Import our files
import { Error } from '../objects/error';
import { RemoteError } from '../objects/remote-error';
import { CommonUtilsService } from '../utils/common-utils.service';

@Injectable()
export class ErrorService {
  constructor(private _utils: CommonUtilsService) {}

  /**
   * Returns the appropriate error object for a given Feasy API response
   * @param {Response} [_errorResponse = new Response()] the Feasy API HTTP response
   * @return {RemoteError} the Error corresponding to the the Response input argument
   */
  getRemoteError(_errorResponse: Response = new Response(null)): RemoteError {
    // Get the error details from the response body
    const responseBody: Object = _errorResponse.json();
    const errorResponseDetails: Object = responseBody && responseBody['error'];

    // Get metadata from the response: 1) Request ID that the API attached to the HTTP response. 2) The HTTP status code
    const headers: Headers = _errorResponse.headers || new Headers();
    const requestId: string = headers.get('requestId');
    const statusCode: number = _errorResponse.status;

    // Create the RemoteError object from the response error details
    const error: RemoteError = new RemoteError(null, requestId, statusCode).deserialize(errorResponseDetails);

    return error;
  } // End getRemoteError()

  /**
   * Parses an error message about invalid/unchanged parameters to return those incorrect parameters individually
   * @param {string} [_errorMessage = ''] the error message about incorrect parameters
   * @param {string} [_splitRegex = ''] the pattern to split the error message with
   * @param {string} [_secondarySplitRegex = ','] the pattern to split the parameters string that was split form the error message with
   * @return {string[]} the separated incorrect parameters
   */
  private splitParameters(_errorMessage: string = '', _splitRegex: string = '', _secondarySplitRegex: string = ','): string[] {
    const errorMessageSplit: string[] = _errorMessage.split(_splitRegex);
    const paramsString: string = errorMessageSplit.length >= 2 ? errorMessageSplit[1] : '';
    const params: string[] = paramsString.split(_secondarySplitRegex);

    return params;
  } // End splitParameters()

  /**
   * Gets the invalid parameters for a given 'Invalid parameters' error message
   * @param {Error} [_error = new Error()] the Feasy error
   * @return {string[]} the invalid parameters
   */
  getInvalidParameters(_error: Error = new Error()): string[] {
    const errorMessage: string = _error.getMessage();
    const invalidParameters: string[] = this.splitParameters(errorMessage, 'Invalid parameters: ');

    return invalidParameters;
  } // End getInvalidParameters()

  /**
   * Gets the secondary invalid parameters for a given 'Invalid parameters'
   * error message that has multiple objects containing invalid parameters
   * @param {Error} [_error = new Error()] the Feasy error
   * @return {Object[]} the invalid parameters for the index of each object containing invalid parameters
   */
  getSecondaryInvalidParameters(_error: Error = new Error()): Object[] {
    const invalidParameters: string[] = this.getInvalidParameters(_error);

    const secondaryInvalidParametersCollection: Object[] = [];
    if (invalidParameters.length > 0) {
      invalidParameters.forEach((invalidParameterString) => {
        const matches: string[] = invalidParameterString.match(/\d+/g);
        const index: string = matches.length > 0 ? matches[0] : '';
        const secondaryInvalidParameters: string[] = this.splitParameters(invalidParameterString, `${index}) `, '.');
        const invalidParametersJson: Object = { [index]: secondaryInvalidParameters };
        secondaryInvalidParametersCollection.push(invalidParametersJson);
      });
    }

    return secondaryInvalidParametersCollection;
  } // End getSecondaryInvalidParameters()

  /**
   * Gets the unchanged parameters for a given 'Unchanged parameters' error message
   * @param {Error} [_error = new Error()] the Feasy error
   * @return {string[]} the unchanged parameters
   */
  getUnchangedParameters(_error: Error = new Error()): string[] {
    const errorMessage = _error.getMessage();
    const unchangedParameters = this.splitParameters(errorMessage, 'Unchanged paramters: ');

    return unchangedParameters;
  } // End getUnchangedParameters()

  /**
   * Determines if a Feasy error has a specific error type
   * @param {Error} [_error = new Error()] the Feasy error to check
   * @param {string} _preferredType the specific error type to test
   * @return {boolean} whether or not the given error is of the specific type
   */
  private isErrorType(_error: Error = new Error(), _preferredType: string): boolean {
    return _error.getType() === _preferredType;
  }

  /**
   * Determines if a Feasy error is an API error
   * @param {Error} [_error = new Error()] the Feasy error to check
   * @return {boolean} whether or not the given error is an API error
   */
  isApiError(_error: Error = new Error()): boolean {
    return this.isErrorType(_error, 'api_error');
  }

  /**
   * Determines if a Feasy error is an authentication error
   * @param {Error} [_error = new Error()] the Feasy error to check
   * @return {boolean} whether or not the given error is an authentication error
   */
  isAuthError(_error: Error = new Error()): boolean {
    return this.isErrorType(_error, 'authentication_error');
  }

  /**
   * Determines if a Feasy error is an invalid media type error
   * @param {Error} [_error = new Error()] the Feasy error to check
   * @return {boolean} whether or not the given error is an invalid media type error
   */
  isMediaError(_error: Error = new Error()): boolean {
    return this.isErrorType(_error, 'invalid_media_type')
  }

  /**
   * Determines if a Feasy error is an invalid request error
   * @param {Error} [_error = new Error()] the Feasy error to check
   * @return {boolean} whether or not the given error is an invalid request error
   */
  isInvalidRequestError(_error: Error = new Error()): boolean {
    return this.isErrorType(_error, 'invalid_request_error');
  }

  /**
   * Determines if a Feasy error is a login error
   * @param {Error} [_error = new Error()] the Feasy error to check
   * @return {boolean} whether or not the given error is a login error
   */
  isLoginError(_error: Error = new Error()): boolean {
    return this.isErrorType(_error, 'login_error');
  }

  /**
   * Determines if a Feasy error is a resource does not exist error
   * @param {Error} [_error = new Error()] the Feasy error to check
   * @return {boolean} whether or not the given error is a resource does not exist error
   */
  isResourceDneError(_error: Error = new Error()): boolean {
    return this.isErrorType(_error, 'resource_dne_error');
  }

  /**
   * Determines if a Feasy error is a resource error
   * @param {Error} [_error = new Error()] the Feasy error to check
   * @return {boolean} whether or not the given error is a resource error
   */
  isResourceError(_error: Error = new Error()): boolean {
    return this.isErrorType(_error, 'resource_error');
  }

  /**
   * Returns the object type that a given Error could be (like Error, RemoteError, LocalError, unknown, etc)
   * @param {Error} _error the error to determine the object type of
   * @return {string} the object type of the Error
   */
  getErrorObjectType(_error: Error): string {
    let errorType;
    if (!this._utils.hasValue(_error)) errorType = 'unknown';
    else if (_error.constructor.name === 'Error') errorType = 'Error';
    else if (_error.constructor.name === 'LocalError') errorType = 'LocalError';
    else if (_error.constructor.name === 'RemoteError') errorType = 'RemoteError';
    else errorType = 'unknown';

    return errorType;
  } // End getErrorObjectType()

  isRegularError(_error: Error): boolean {
    return this.getErrorObjectType(_error) === 'Error';
  }

  isLocalError(_error: Error): boolean {
    return this.getErrorObjectType(_error) === 'LocalError';
  }

  isRemoteError(_error: Error): boolean {
    return this.getErrorObjectType(_error) === 'RemoteError';
  }

  isInvalidRequestErrorObject(_error: Error): boolean {
    return this.getErrorObjectType(_error) === 'InvalidRequestError';
  }
}
