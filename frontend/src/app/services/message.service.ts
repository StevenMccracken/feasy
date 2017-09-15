// Import angular packages
import { Injectable } from '@angular/core';

// Import 3rd-party libraries
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class MessageService {
  private subject: Subject<any> = new Subject<any>();

  /**
   * Sends a message to all subscribers of the subject
   * @param {string} _source the sender of the message
   * @param {string} _message the content of the message
   */
  sendMessage(_source: string, _message: string): void {
    const content: Object = {
      source: _source,
      message: _message,
    };

    this.subject.next(content);
  } // End sendMessage()

  /**
   * Clears any messages that were sent to subscribers
   */
  clearMessage(): void {
    this.subject.next();
  } // End clearMessage()

  /**
   * Returns the object to subscribe to
   * @return {Observable<any>} the subscribable message
   */
  getMessage(): Observable<any> {
    return this.subject.asObservable();
  } // End getMessage()
}
