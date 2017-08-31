interface Serializable<T> {
  deserialize(_input: Object): T;
}

export class User implements Serializable<User> {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  avatar: string;

  /**
   * Converts a JSON representing a user to a User object
   * @param {Object = {}} _input JSON containing user information
   * @return {User} user with the attributes from the JSON input
   */
  deserialize(_input: Object = {}): User {
    this.email = _input['email'];
    this.username = _input['username'];
    this.password = _input['password'];
    this.firstName = _input['firstName'];
    this.lastName = _input['lastName'];
    this.avatar = _input['avatar'];

    return this;
  }
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
   * @param {Object = {}} _input JSON containing account information
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
  }
}
