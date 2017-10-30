// Import angular packages
import { Injectable } from '@angular/core';

// Import 3rd-party libraries
import { v4 as uuid } from 'uuid';

/**
 * A utility class for common functions that are used in multiple components
 */
@Injectable()
export class CommonUtilsService {
  constructor() {}

  /**
   * Determines whether a value is a string or not
   * @param {any} _value any value to test
   * @return {boolean} whether or not the value is a string
   */
  isString(_value: any): boolean {
    return typeof _value === 'string';
  } // End isString()

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

  /**
   * Generates a random UUID string
   * @return {string} the random UUID
   */
  uuid(): string {
    return uuid();
  } // End newUuid()

  /**
   * Generator function to get an infinite sequence of integers
   * @param {number} _start the starting value of the infinite
   * sequence. If no value is provided, 0 will be the starting value
   * @return {IterableIterator<number>} the iterator to get more numbers from
   */
  *integerSequence(_start?: number): IterableIterator<number> {
    let i = this.hasValue(_start) && typeof _start === 'number' ? _start : 0;
    while (true) yield i++;
  } // End infiniteSequence()

  /**
   * Returns the number of milliseconds in a given number of hours
   * @param {number} _hours decimal number of hours
   * @return {number} the number of milliseconds
   */
  getUnixMillisecondsFromHours(_hours: number): number {
    return _hours * 3600000;
  } // End getUnixMillisecondsFromHours()

  /**
   * Returns the number of milliseconds in 12 hours
   * @return {number} [description]
   */
  getUnixMilliseconds12Hours(): number {
    return this.getUnixMillisecondsFromHours(12);
  } // End getUnixMilliseconds12Hours()
}
