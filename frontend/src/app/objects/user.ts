interface Serializable<T> {
  deserialize(input: Object): T;
}

export class User implements Serializable<User> {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;

  deserialize(input) {
    this.email = input.email;
    this.username = input.username;
    this.password = input.password;
    this.firstName = input.firstName;
    this.lastName = input.lastName;

    return this;
  }
}

export class Account implements Serializable<Account> {
  _id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;

  /**
   * Converts a JSON representing an account to an Account object
   * @param {Object} input JSON containing account information
   * @return {Account} account with the attributes from the JSON input
   */
  deserialize(input) {
    this._id = input._id;
    this.email = input.email;
    this.username = input.username;
    this.firstName = input.firstName;
    this.lastName = input.lastName;

    return this;
  }
}
