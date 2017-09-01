// Import angular packages
import { Injectable } from '@angular/core';

// Import our files
import { CommonUtilsService } from '../utils/common-utils.service';

/**
 * Returns a file path to a static avatar image for a given avatar identifier
 */
@Injectable()
export class AvatarService {
  private avatarsArray: Object[];
  private avatars: Object = {
    default: {
      name: 'default',
      url: '../../assets/avatar_default.png',
    },
    lightMale: {
      name: 'lightMale',
      url: '../../assets/avatar_lightMale.png',
    },
    lightFemale: {
      name: 'lightFemale',
      url: '../../assets/avatar_lightFemale.png',
    },
    darkMale: {
      name: 'darkMale',
      url: '../../assets/avatar_darkMale.png',
    },
    darkFemale: {
      name: 'darkFemale',
      url: '../../assets/avatar_darkFemale.png',
    },
    lightMaleBeard: {
      name: 'lightMaleBeard',
      url: '../../assets/avatar_lightMaleBeard.png',
    },
  };

  constructor(private _utils: CommonUtilsService) {
    this.avatarsArray = Array.of(this.avatars);
  }

  getDefaultAvatarUrl(): string {
    return this.avatars['default'].url;
  }

  getAllAvatars(): Object[] {
    return this.avatarsArray;
  }

  getAvatarUrl(_type: string = ''): string {
    let avatarUrl: string;
    const avatarObject: Object = this.avatars[_type];
    if (!this._utils.hasValue(avatarObject) || !this._utils.isJsonEmpty(avatarObject)) {
      avatarUrl = this.avatars['default'].url;
    } else avatarUrl = avatarObject['url'];

    return avatarUrl;
  }
}
