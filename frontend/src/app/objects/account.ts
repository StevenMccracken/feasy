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

  getId(): string {
    return this._id;
  }

  getEmail(): string {
    return this.email;
  }

  getUsername(): string {
    return this.username;
  }

  getFirstName(): string {
    return this.firstName;
  }

  getLastName(): string {
    return this.lastName;
  }

  getAvatar(): string {
    return this.avatar;
  }

  setId(_id: string): void {
    this._id = _id;
  }

  setEmail(_email: string): void {
    this.email = _email;
  }

  setUsername(_username: string): void {
    this.username = _username;
  }

  setFirstName(_firstName: string): void {
    this.firstName = _firstName;
  }

  setLastName(_lastName: string): void {
    this.lastName = _lastName;
  }

  setAvatar(_avatar: string): void {
    this.avatar = _avatar;
  }
}
