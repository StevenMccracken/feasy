interface Serializable<T> {
  deserialize(_input: Object): T;
}

export class Account implements Serializable<Account> {
  _id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string;

  /**
   * Converts a JSON representing an account to an Account object
   * @param {Object} [_input = {}] JSON containing account information
   * @return {Account} account with the attributes from the JSON input
   */
  deserialize(_input: Object = {}): Account {
    this._id = _input['_id'];
    this.email = _input['email'];
    this.username = _input['username'];
    this.firstName = _input['firstName'];
    this.lastName = _input['lastName'];
    this.avatar = _input['avatar'];

    return this;
  } // End deserialize()
}
