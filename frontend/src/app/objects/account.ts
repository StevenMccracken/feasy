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

  getId(): string {
    return this._id;
  } // End getId()

  getEmail(): string {
    return this.email;
  } // End getEmail()

  getUsername(): string {
    return this.username;
  } // End getUsername()

  getFirstName(): string {
    return this.firstName;
  } // End getFirstName()

  getLastName(): string {
    return this.lastName;
  } // End getLastName()

  getAvatar(): string {
    return this.avatar;
  } // End getAvatar()

  setId(_id: string): void {
    this._id = _id;
  } // End setId()

  setEmail(_email: string): void {
    this.email = _email;
  } // End setEmail()

  setUsername(_username: string): void {
    this.username = _username;
  } // End setUsername()

  setFirstName(_firstName: string): void {
    this.firstName = _firstName;
  } // End setFirstName()

  setLastName(_lastName: string): void {
    this.lastName = _lastName;
  } // End setLastName()

  setAvatar(_avatar: string): void {
    this.avatar = _avatar;
  } // End setAvatar()
}
