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
}
