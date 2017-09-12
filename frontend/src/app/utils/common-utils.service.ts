// Import angular packages
import { Injectable } from '@angular/core';

/**
 * A utility class for common functions that are used in multiple components
 */
@Injectable()
export class CommonUtilsService {
  constructor() {}

  /**
   * Determines whether a JSON is empty or not
   * @param {Object} [_json = {}] the JSON to test
   * @return {boolean} whether or not the JSON is empty
   */
  isJsonEmpty(_json: Object = {}): boolean {
    return Object.keys(_json).length === 0 && _json.constructor === Object;
  } // End isJsonEmpty()

  /**
   * Determines whether an object has a value (not null and not undefined)
   * @param {any} _object the object to test
   * @return {boolean} whether or not the object has a value
   */
  hasValue(_object: any): boolean {
    return _object !== null && _object !== undefined;
  } // End hasValue()

  /**
   * Stringifies a JSON into a JSON string
   * @param {Object} [_object = {}] the JSON to stringify
   * @return {string} the stringified JSON
   */
  stringify(_object: Object = {}): string {
    return JSON.stringify(_object);
  } // End stringify()
}
