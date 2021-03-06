// Import angular packages
import { Injectable } from '@angular/core';

// Import our files
import { CommonUtilsService } from './common-utils.service';

/**
 * A utility class for interacting with the browser's local storage
 */
@Injectable()
export class LocalStorageService {
  constructor(private _utils: CommonUtilsService) {}

  /**
   * Determines if a specific local storage item contains any meaningful data
   * @param {string} _itemKey the key of the local storage item
   * @return {boolean} whether or not the key is not null, not undefined, and not an empty string
   */
  isValidItem(_itemKey: string): boolean {
    const storageItem: string = localStorage.getItem(_itemKey);
    return this._utils.hasValue(storageItem) && storageItem !== '';
  }

  /**
   * Retrieves a specific item from local storage
   * @param {string} _itemKey the key of the local storage item
   * @return {string} the specific local storage item
   */
  getItem(_itemKey: string): string {
    return localStorage.getItem(_itemKey);
  }

  /**
   * Sets a value for a specific item in local storage. Adds
   * the value if _itemKey does not exist. Overwrites
   * an existing value if _itemKey already exists
   * @param {string} _itemKey the key of the local storage item
   * @param {string} _value the value to set for _itemKey
   */
  setItem(_itemKey: string, _value: string): void {
    localStorage.setItem(_itemKey, _value);
  }

  /**
   * Clears any values in local storage for a specific item
   * @param {string} _itemKey the key of the existing local storage item
   */
  clearItem(_itemKey: string): void {
    if (this.isValidItem(_itemKey)) {
      this.setItem(_itemKey, '');
    }
  }

  /**
   * Removes a specific item from local storage. _itemKey and the associated value will be removed.
   * @param {string} _itemKey the key of the local storage item
   */
  deleteItem(_itemKey: string): void {
    localStorage.removeItem(_itemKey);
  }
}
