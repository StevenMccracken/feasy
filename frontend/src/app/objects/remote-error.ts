// Import our files
import { Error } from './error';

interface Serializable<T> {
  deserialize(_input: Object): T;
}

export class RemoteError extends Error implements Serializable<RemoteError> {
  private remoteId: string;
  private requestId: string;
  private statusCode: number;

  constructor(localSource?: string, requestId?: string, statusCode?: number) {
    super(localSource);

    if (this.utils.hasValue(requestId)) this.requestId = requestId;
    if (this.utils.hasValue(statusCode)) this.statusCode = statusCode;
  }

  /**
   * Converts a JSON representing an error to a RemoteError object
   * @param {Object} [_input = {}] JSON containing error information
   * @return {RemoteError} error with the attributes from the JSON input
   */
  deserialize(_input: Object = {}): RemoteError {
    this.remoteId = _input['id'];
    this.setType(_input['type']);
    this.setMessage(_input['message']);

    return this;
  } // End deserialize()

  getRequestId(): string {
    return this.requestId;
  } // End getStatusCode()

  getStatusCode(): number {
    return this.statusCode;
  } // End getStatusCode()

  setRequestId(_requestId: string): void {
    this.requestId = _requestId;
  } // End setRequestId()

  setStatusCode(_statusCode: number): void {
    this.statusCode = _statusCode;
  } // End setStatusCode()
}
