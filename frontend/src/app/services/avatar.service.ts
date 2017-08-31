import { Injectable } from '@angular/core';

/**
 * Returns a link to a downloadable avatar image for a given avatar identifier
 */
@Injectable()
export class AvatarService {
  private default: string = '../../assets/avatar_default.png';
  private lightMale: string = '../../assets/avatar_lightMale.png';
  private lightFemale: string = '../../assets/avatar_lightFemale.png';
  private darkMale: string = '../../assets/avatar_darkMale.png';
  private darkFemale: string = '../../assets/avatar_darkFemale.png';
  private avatars = [
    {
      name: 'default',
      url: this.default,
    },
    {
      name: 'lightMale',
      url: this.lightMale,
    },
    {
      name: 'lightFemale',
      url: this.lightFemale,
    },
    {
      name: 'darkMale',
      url: this.darkMale,
    },
    {
      name: 'darkFemale',
      url: this.darkFemale,
    },
  ];

  constructor() {}

  getDefaultAvatarUrl(): string {
    return this.default;
  }

  getAllAvatars(): Object[] {
    return this.avatars;
  }

  getAvatarUrl(_type: string = ''): string {
    let avatarUrl: string;
    switch (_type) {
      case 'lightMale':
        avatarUrl = this.lightMale;
        break;
      case 'lightFemale':
        avatarUrl = this.lightFemale;
        break;
      case 'darkMale':
        avatarUrl = this.darkMale;
        break;
      case 'darkFemale':
        avatarUrl = this.darkFemale;
        break;
      default:
        avatarUrl = this.default;
    }

    return avatarUrl;
  }
}
