// Import our files
import { CommonUtilsService } from '../utils/common-utils.service';

export class Error {
  private id: string;
  private type: string;
  private message: string;
  private localSource: string;
  private customProperties: Object;
  protected utils: CommonUtilsService;

  constructor(localSource?: string) {
    this.utils = new CommonUtilsService();

    // Set a unique ID for the error
    const uuid = this.utils.uuid();
    this.setId(uuid);

    // Initialize the custom properties JSON
    this.customProperties = {};

    // Set the source of the error if it exists
    if (this.utils.hasValue(localSource)) this.setLocalSource(localSource);
  }

  getId(): string {
    return this.id;
  } // End getId()

  getType(): string {
    return this.type;
  } // End getType()

  getMessage(): string {
    return this.message;
  } // End getMessage()

  getLocalSource(): string {
    return this.localSource;
  } // End getLocalSource()

  getCustomProperties(): Object {
    return this.customProperties;
  } // End getCustomProperties()

  getCustomProperty(_customPropertyName: string) {
    return this.customProperties[_customPropertyName];
  } // End getCustomProperty()

  setId(_id: string): void {
    this.id = _id;
  } // End setId()

  setType(_type: string): void {
    this.type = _type;
  } // End setType()

  setMessage(_message: string): void {
    this.message = _message;
  } // End setMessage()

  setLocalSource(_localSource: string): void {
    this.localSource = _localSource;
  } // End setLocalSource()

  setCustomProperty(_customPropertyName: string, _value: any) {
    this.customProperties[_customPropertyName] = _value;
  } // End setCustomProperty()
}
