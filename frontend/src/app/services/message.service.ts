import { Observable } from 'rxjs';
import { Subject } from 'rxjs/Subject';
import { Injectable } from '@angular/core';

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
