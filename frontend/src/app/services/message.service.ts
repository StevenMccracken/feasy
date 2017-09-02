// Import angular packages
import { Injectable } from '@angular/core';

// Import 3rd party libraries
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class MessageService {
  private subject = new Subject<any>();

  sendMessage(_message: string) {
    this.subject.next({ text: _message });
  }

  clearMessage() {
    this.subject.next();
  }

  getMessage(): Observable<any> {
    return this.subject.asObservable();
  }
}
