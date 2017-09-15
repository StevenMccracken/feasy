// Import our files
import { Error } from './error';

export class LocalError extends Error {
  constructor(localSource?: string) {
    super(localSource);
  }
}
