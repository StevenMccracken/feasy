import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/toPromise';
import { Injectable } from '@angular/core';
import { Headers, Http, RequestOptions, Response, URLSearchParams } from '@angular/http';

import { CommonUtilsService } from '../utils/common-utils.service';

@Injectable()
export class FeasyService {
  private baseUrl: string = 'http://localhost:8080';//'https://api.feasy-app.com';
  private contentType_UrlEncoded: string = 'application/x-www-form-urlencoded';
  private standardHeaders: Headers = new Headers({ 'Content-Type': this.contentType_UrlEncoded });

  constructor(private _http: Http, private _utils: CommonUtilsService) {}

  /**
   * Sends a POST request to the Feasy API
   * @param {string = ''} _path the route within the API
   * @param {Object = {}} _bodyParameters the request parameters to send with the request
   * @param {Object = {}} _headers the header properties to send with the request
   * @return {Promise<Response>} the API HTTP response
   */
  post(_path: string = '', _bodyParameters: Object = {}, _headers: Object = {}): Promise<Response> {
    return this.sendRequest('post', _path, _bodyParameters, _headers)
      .then((successResponse: Response) => Promise.resolve(successResponse))
      .catch((errorResponse: Response) => Promise.reject(errorResponse));
  }

  /**
   * Sends a GET request to the Feasy API
   * @param {string = ''} _path the route within the API
   * @param {Object = {}} _headers the header properties to send with the request
   * @return {Promise<Response>} the API HTTP response
   */
  get(_path: string = '', _headers: Object = {}): Promise<Response> {
    return this.sendRequest('get', _path, {}, _headers)
      .then((successResponse: Response) => Promise.resolve(successResponse))
      .catch((errorResponse: Response) => Promise.reject(errorResponse));
  }

  /**
   * Sends a PUT request to the Feasy API
   * @param {string = ''} _path the route within the API
   * @param {Object = {}} _bodyParameters the request parameters to send with the request
   * @param {Object = {}} _headers the header properties to send with the request
   * @return {Promise<Response>} the API HTTP response
   */
  put(_path: string = '', _bodyParameters: Object = {}, _headers: Object = {}): Promise<Response> {
    return this.sendRequest('put', _path, _bodyParameters, _headers)
      .then((successResponse: Response) => Promise.resolve(successResponse))
      .catch((errorResponse: Response) => Promise.reject(errorResponse));
  }

  /**
   * Sends a DELETE request to the Feasy API
   * @param {string = ''} _path the route within the API
   * @param {Object = {}} _headers the header properties to send with the request
   * @return {Promise<Response>} the API HTTP response
   */
  delete(_path: string = '', _headers: Object = {}): Promise<Response> {
    return this.sendRequest('delete', _path, {}, _headers)
      .then((successResponse: Response) => Promise.resolve(successResponse))
      .catch((errorResponse: Response) => Promise.reject(errorResponse));
  }

  /**
   * Uses the Angular HTTP service to send a request to the Feasy REST API
   * @param {string = ''} _requestType the type of HTTP request to send
   * @param {string = ''} _path the route within the API
   * @param {Object = {}} _bodyParameters the request parameters to send with the request
   * @param {Object = {}} _headers the header properties to send with the request
   * @return {Promise<Response>} the API HTTP response
   */
  private sendRequest(
    _requestType: string = '',
    _path: string = '',
    _bodyParameters: Object = {},
    _headers: Object = {}
  ): Promise<Response> {
    // Append route path to base API URL
    let requestUrl = this.buildRequestUrl(_path);

    // Create request search parameters object from JSON
    let requestParameters = this.buildSearchParameters(_bodyParameters);

    // Create headers for request
    let requestHeaders: Headers;
    if (this._utils.isJsonEmpty(_headers)) requestHeaders = this.standardHeaders;
    else {
      requestHeaders = new Headers({ 'Content-Type': this.contentType_UrlEncoded });
      for (let headerKey in _headers) requestHeaders.append(headerKey, _headers[headerKey]);
    }

    // Add headers to request options object
    let requestOptions = new RequestOptions({ headers: requestHeaders });

    // Determine appropriate http request method
    let httpRequest;
    switch (_requestType) {
      case 'post':
        httpRequest = this._http.post(requestUrl, requestParameters, requestOptions).toPromise();
        break;
      case 'get':
        httpRequest = this._http.get(requestUrl, requestOptions).toPromise();
        break;
      case 'put':
        httpRequest = this._http.put(requestUrl, requestParameters, requestOptions).toPromise();
        break;
      case 'delete':
        httpRequest = this._http.delete(requestUrl, requestOptions).toPromise();
        break;
      default:
        httpRequest = new Promise((resolve, reject) => reject(new Response(null)));
    }

    // Send request
    return httpRequest
      .then((successResponse: Response) => Promise.resolve(successResponse))
      .catch((errorResponse: Response) => Promise.reject(errorResponse));
  }

  /**
   * Builds the full API URL to send a request to
   * @param {string = ''} _path the route within the API
   * @return {string} the fully-qualified API route to send a request to
   */
  private buildRequestUrl(_path: string = ''): string {
    return _path.length === 0 ? this.baseUrl : `${this.baseUrl}${_path}`;
  }

  /**
   * Creates a request search parameters object to send
   * for an application/x-www-form-urlencoded request
   * @param {Object = {}} _parametersJson the request parameters to send with the request
   * @return {URLSearchParams} the request search parameters
   */
  private buildSearchParameters(_parametersJson: Object = {}): URLSearchParams {
    // Create a request search parameters object from the body parameters JSON
    let searchParameters = new URLSearchParams();
    for (let parameter in _parametersJson) {
      searchParameters.append(parameter, _parametersJson[parameter]);
    }

    return searchParameters;
  }
}
