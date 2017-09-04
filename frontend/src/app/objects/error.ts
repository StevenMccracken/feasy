interface Serializable<T> {
  deserialize(_input: Object): T;
}

export class Error implements Serializable<Error> {
  private id: string;
  private type: string;
  private message: string;
  private statusCode: number;
  private requestId: string;
  private localSource: string;

  /**
   * Converts a JSON representing an error to an Error object
   * @param {Object = {}} _input JSON containing error information
   * @return {Error} error with the attributes from the JSON input
   */
  deserialize(_input: Object = {}): Error {
    this.id = _input['id'];
    this.type = _input['type'];
    this.message = _input['message'];

    return this;
  }

  getId(): string {
    return this.id;
  }

  getType(): string {
    return this.type;
  }

  getMessage(): string {
    return this.message;
  }

  getStatusCode(): number {
    return this.statusCode;
  }

  getRequestId(): string {
    return this.requestId;
  }

  getLocalSource(): string {
    return this.localSource;
  }

  setId(_id: string): void {
    this.id = _id;
  }

  setType(_type: string): void {
    this.type = _type;
  }

  setMessage(_message: string): void {
    this.message = _message;
  }

  setStatusCode(_statusCode: number): void {
    this.statusCode = _statusCode;
  }

  setRequestId(_requestId: string): void {
    this.requestId = _requestId;
  }

  setLocalSource(_localSource: string): void {
    this.localSource = _localSource;
  }
}
