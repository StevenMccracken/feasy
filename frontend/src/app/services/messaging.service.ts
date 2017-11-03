// Import Angular packages
import { Injectable } from '@angular/core';

// Import 3rd-party libraries
import {
  Subject,
  Observable,
} from 'rxjs/Rx';

// Import our files
import { CommonUtilsService } from '../utils/common-utils.service';

interface Message {
  data: any;
  channel: string;
}

@Injectable()
export class MessagingService {
  private message: Subject<Message>;

  constructor(private UTILS: CommonUtilsService) {
    this.message = new Subject<Message>();
  }

  /**
   * Publishes messages for subscribers to
   * receive, conforming to the {Message} interface
   * @param {T} _message the message to be sent
   */
  public publish<T>(_message: T): void {
    // Create a channel for the message to be sent to based on the constructor name of the Message object
    const channel: string = (<any>_message.constructor).name;
    const message: Message = {
      channel,
      data: _message,
    };

    this.message.next(message);
  } // End publish()

  /**
   * Subscribe to messages that were published to a certain channel
   * @param {Class} _messageType the class of the type of messages to subscribe to
   * @return {Observable<T>} a subscription to subscribe to for messages
   */
  public messagesOf<T>(_messageType: { new(...args: any[]): T }): Observable<T> {
    const channel: string = (<any>_messageType).name;
    return this.message.filter(message => message.channel === channel).map(message => message.data);
  } // End of()
}
