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
   * @param {Object} [_input = {}] JSON containing user information
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
  } // End deserialize()

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
