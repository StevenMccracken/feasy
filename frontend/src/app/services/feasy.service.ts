// Import angular packages
import {
  Http,
  Headers,
  Response,
  RequestOptions,
  URLSearchParams,
} from '@angular/http';
import { Injectable } from '@angular/core';

// Import our files
import { CommonUtilsService } from '../utils/common-utils.service';
import { environment as ENVIRONMENT } from '../../environments/environment';

@Injectable()
export class FeasyService {
  private baseUrl: string = ENVIRONMENT.feasyApiUrl;
  private contentTypes: Object = {
    json: 'application/json',
    urlencoded: 'application/x-www-form-urlencoded',
  };

  private standardHeaders: Headers = new Headers({ 'Content-Type': this.contentTypes['urlencoded'] });

  constructor(private HTTP: Http, private UTILS: CommonUtilsService) {}

  /**
   * Sends a POST request to the Feasy API
   * @param {string} [_path = ''] the route within the API
   * @param {Object} [_bodyParameters = {}] the request parameters to send with the request
   * @param {Object} [_headers = {}] the header properties to send with the request
   * @return {Promise<Response>} the HTTP response
   */
  post(_path: string = '', _bodyParameters: Object = {}, _headers: Object = {}): Promise<Response> {
    console.log("went through");
    return this.sendRequest('post', _path, _bodyParameters, _headers)
      .then((successResponse: Response) => Promise.resolve(successResponse))
      .catch((errorResponse: Response) => Promise.reject(errorResponse));
  } // End post()

  /**
   * Sends a GET request to the Feasy API
   * @param {string} [_path = ''] the route within the API
   * @param {Object} [_headers = {}] the header properties to send with the request
   * @return {Promise<Response>} the HTTP response
   */
  get(_path: string = '', _headers: Object = {}): Promise<Response> {
    return this.sendRequest('get', _path, {}, _headers)
      .then((successResponse: Response) => Promise.resolve(successResponse))
      .catch((errorResponse: Response) => Promise.reject(errorResponse));
  } // End get()

  /**
   * Sends a PUT request to the Feasy API
   * @param {string} [_path = ''] the route within the API
   * @param {Object} [_bodyParameters = {}] the request parameters to send with the request
   * @param {Object} [_headers = {}] the header properties to send with the request
   * @return {Promise<Response>} the HTTP response
   */
  put(_path: string = '', _bodyParameters: Object = {}, _headers: Object = {}): Promise<Response> {
    return this.sendRequest('put', _path, _bodyParameters, _headers)
      .then((successResponse: Response) => Promise.resolve(successResponse))
      .catch((errorResponse: Response) => Promise.reject(errorResponse));
  } // End put()

  /**
   * Sends a DELETE request to the Feasy API
   * @param {string} [_path = ''] the route within the API
   * @param {Object} [_headers = {}] the header properties to send with the request
   * @return {Promise<Response>} the HTTP response
   */
  delete(_path: string = '', _headers: Object = {}): Promise<Response> {
    return this.sendRequest('delete', _path, {}, _headers)
      .then((successResponse: Response) => Promise.resolve(successResponse))
      .catch((errorResponse: Response) => Promise.reject(errorResponse));
  } // End delete()

  /**
   * Uses the Angular HTTP service to send a request to the Feasy REST API
   * @param {string} [_requestType = ''] the type of HTTP request to send
   * @param {string} [_path = ''] the route within the API
   * @param {Object} [_bodyParameters = {}] the request parameters to send with the request
   * @param {Object} [_headers = {}] the header properties to send with the request
   * @return {Promise<Response>} the HTTP response
   */
  private sendRequest(
    _requestType: string = '',
    _path: string = '',
    _bodyParameters: Object = {},
    _headers: Object = {},
  ): Promise<Response> {
    // Append route path to base API URL
    const requestUrl: string = this.buildRequestUrl(_path);

    // Create request search parameters object from JSON
    const requestParameters: URLSearchParams = this.buildSearchParameters(_bodyParameters);

    // Create headers for request
    let requestHeaders: Headers;
    if (this.UTILS.isJsonEmpty(_headers)) requestHeaders = this.standardHeaders;
    else {
      requestHeaders = new Headers({ 'Content-Type': this.contentTypes['urlencoded'] });
      for (const headerKey in _headers) {
        if (_headers.hasOwnProperty(headerKey)) {
          requestHeaders.append(headerKey, _headers[headerKey]);
        }
      }
    }

    // Add headers to request options object
    const requestOptions: RequestOptions = new RequestOptions({ headers: requestHeaders });

    // Determine appropriate http request method
    let httpRequest;
    switch (_requestType) {
      case 'post':
        httpRequest = this.HTTP.post(requestUrl, requestParameters, requestOptions).toPromise();
        break;
      case 'get':
        httpRequest = this.HTTP.get(requestUrl, requestOptions).toPromise();
        break;
      case 'put':
        httpRequest = this.HTTP.put(requestUrl, requestParameters, requestOptions).toPromise();
        break;
      case 'delete':
        httpRequest = this.HTTP.delete(requestUrl, requestOptions).toPromise();
        break;
      default:
        httpRequest = new Promise((resolve, reject) => reject(new Response(null)));
    }

    // Send request
    const promise = httpRequest
      .then((successResponse: Response) => Promise.resolve(successResponse))
      .catch((errorResponse: Response) => Promise.reject(errorResponse));

    return promise;
  } // End sendRequest()

  /**
   * Builds the full API URL to send a request to
   * @param {string} [_path = ''] the route within the API
   * @return {string} the fully-qualified API route to send a request to
   */
  private buildRequestUrl(_path: string = ''): string {
    return _path.length === 0 ? this.baseUrl : `${this.baseUrl}${_path}`;
  } // End buildRequestUrl()

  /**
   * Creates a request search parameters object to send for an application/x-www-form-urlencoded request
   * @param {Object} [_parametersJson = {}] the request parameters to send with the request
   * @return {URLSearchParams} the request search parameters
   */
  private buildSearchParameters(_parametersJson: Object = {}): URLSearchParams {
    // Create a request search parameters object from the body parameters JSON
    const searchParameters: URLSearchParams = new URLSearchParams();
    for (const parameter in _parametersJson) {
      if (_parametersJson.hasOwnProperty(parameter)) {
        if (Array.isArray(_parametersJson[parameter])) {
          _parametersJson[parameter].forEach(value => searchParameters.append(`${parameter}[]`, value));
        } else searchParameters.append(parameter, _parametersJson[parameter]);
      }
    }

    return searchParameters;
  } // End buildSearchParameters()
}
