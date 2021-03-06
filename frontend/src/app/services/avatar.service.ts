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
    darkFemale: {
      name: 'darkFemale',
      url: '../../assets/avatar_darkFemale.png',
    },
    darkMale: {
      name: 'darkMale',
      url: '../../assets/avatar_darkMale.png',
    },
    default: {
      name: 'default',
      url: '../../assets/avatar_default.png',
    },
    lightFemale: {
      name: 'lightFemale',
      url: '../../assets/avatar_lightFemale.png',
    },
    lightFemaleBlonde: {
      name: 'lightFemaleBlonde',
      url: '../../assets/avatar_lightFemaleBlonde.png',
    },
    lightFemaleBrown: {
      name: 'lightFemaleBrown',
      url: '../../assets/avatar_lightFemaleBrown.png',
    },
    lightFemaleOldWhiteHair: {
      name: 'lightFemaleOldWhiteHair',
      url: '../../assets/avatar_lightFemaleOldWhiteHair.png',
    },
    lightMale: {
      name: 'lightMale',
      url: '../../assets/avatar_lightMale.png',
    },
    lightMaleBeard: {
      name: 'lightMaleBeard',
      url: '../../assets/avatar_lightMaleBeard.png',
    },
    lightMaleBusiness: {
      name: 'lightMaleBusiness',
      url: '../../assets/avatar_lightMaleBusiness.png',
    },
    lightMaleGreen: {
      name: 'lightMaleGreen',
      url: '../../assets/avatar_lightMaleGreen.png',
    },
    lightMaleOldBlackHair: {
      name: 'lightMaleOldBlackHair',
      url: '../../assets/avatar_lightMaleOldBlackHair.png',
    },
    lightMaleOldWhiteHair: {
      name: 'lightMaleOldWhiteHair',
      url: '../../assets/avatar_lightMaleOldWhiteHair.png',
    },
    lightMaleOrange: {
      name: 'lightMaleOrange',
      url: '../../assets/avatar_lightMaleOrange.png',
    },
    ninjaRedBg: {
      name: 'ninjaRedBg',
      url: '../../assets/avatar_ninjaRedBg.png',
    },
    plainFemale: {
      name: 'plainFemale',
      url: '../../assets/avatar_plainFemale.png',
    },
    plainFemaleHoodie: {
      name: 'plainFemaleHoodie',
      url: '../../assets/avatar_plainFemaleHoodie.png',
    },
    plainFemaleTeen: {
      name: 'plainFemaleTeen',
      url: '../../assets/avatar_plainFemaleTeen.png',
    },
    plainFemaleYoung: {
      name: 'plainFemaleYoung',
      url: '../../assets/avatar_plainFemaleYoung.png',
    },
    plainIronMan: {
      name: 'plainIronMan',
      url: '../../assets/avatar_plainIronMan.png',
    },
    plainMale: {
      name: 'plainMale',
      url: '../../assets/avatar_plainMale.png',
    },
    plainMaleBusiness: {
      name: 'plainMaleBusiness',
      url: '../../assets/avatar_plainMaleBusiness.png',
    },
    plainMaleBusinessMiddle: {
      name: 'plainMaleBusinessMiddle',
      url: '../../assets/avatar_plainMaleBusinessMiddle.png',
    },
    plainMaleBusinessYoung: {
      name: 'plainMaleBusinessYoung',
      url: '../../assets/avatar_plainMaleBusinessYoung.png',
    },
    weirdMaleCrazy: {
      name: 'weirdMaleCrazy',
      url: '../../assets/avatar_weirdMaleCrazy.png',
    },
    weirdMaleStoner: {
      name: 'weirdMaleStoner',
      url: '../../assets/avatar_weirdMaleStoner.png',
    },
    clownSilouhuette: {
      name: 'clownSilouhuette',
      url: '../../assets/avatar_clownSilouhuette.png',
    },
  };

  constructor(private _utils: CommonUtilsService) {
    this.avatarsArray = [];
    for (const avatar in this.avatars) {
      if (this.avatars.hasOwnProperty(avatar)) this.avatarsArray.push(this.avatars[avatar]);
    }
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
    if (!this._utils.hasValue(avatarObject) || this._utils.isJsonEmpty(avatarObject)) {
      avatarUrl = this.avatars['default'].url;
    } else avatarUrl = avatarObject['url'];

    return avatarUrl;
  }
}
