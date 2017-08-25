import { Injectable } from '@angular/core';

/**
 * A utility class for common functions that are used in multiple components
 */
@Injectable()
export class CommonUtilsService {
  constructor() {}

  /**
   * Determines whether a JSON is empty or not
   * @param {Object = {}} _json the JSON to test
   * @return {boolean} whether or not the JSON is empty
   */
  isJsonEmpty(_json: Object = {}): boolean {
    return Object.keys(_json).length === 0 && _json.constructor === Object;
  }

  /**
   * Determines whether an object has a value (not null and not undefined)
   * @param {any} _object the object to test
   * @return {boolean} whether or not the object has a value
   */
  hasValue(_object: any): boolean {
    return _object !== null && _object !== undefined;
  }
}
