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
