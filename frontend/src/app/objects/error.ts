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
   * @param {Object} [_input = {}] JSON containing error information
   * @return {Error} error with the attributes from the JSON input
   */
  deserialize(_input: Object = {}): Error {
    this.id = _input['id'];
    this.type = _input['type'];
    this.message = _input['message'];

    return this;
  } // End deserialize()

  getId(): string {
    return this.id;
  } // End getId()

  getType(): string {
    return this.type;
  } // End getType()

  getMessage(): string {
    return this.message;
  } // End getMessage()

  getStatusCode(): number {
    return this.statusCode;
  } // End getStatusCode()

  getRequestId(): string {
    return this.requestId;
  } // End getStatusCode()

  getLocalSource(): string {
    return this.localSource;
  } // End getLocalSource()

  setId(_id: string): void {
    this.id = _id;
  } // End setId()

  setType(_type: string): void {
    this.type = _type;
  } // End setType()

  setMessage(_message: string): void {
    this.message = _message;
  } // End setMessage()

  setStatusCode(_statusCode: number): void {
    this.statusCode = _statusCode;
  } // End setStatusCode()

  setRequestId(_requestId: string): void {
    this.requestId = _requestId;
  } // End setRequestId()

  setLocalSource(_localSource: string): void {
    this.localSource = _localSource;
  } // End setLocalSource()
}
