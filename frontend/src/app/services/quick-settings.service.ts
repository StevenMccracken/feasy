// Import angular packages
import { Injectable } from '@angular/core';

// Import our files
import { LocalStorageService } from '../utils/local-storage.service';

@Injectable()
export class QuickSettingsService {
  private typeName: string;
  private colorsName: string;
  private descriptionName: string;

  private showType: boolean;
  private showColors: boolean;
  private showDescription: boolean;

  constructor(private STORAGE: LocalStorageService) {
    this.typeName = 'quickSettings_type';
    this.colorsName = 'quickSettings_color';
    this.descriptionName = 'quickSettings_description';

    /*
     * Check if quick settings are already in local storage. Default is true
     * for showing the type and description. Default for colors is false
     */
    if (this.STORAGE.isValidItem(this.typeName)) {
      this.showType = this.STORAGE.getItem(this.typeName) === 'true';
    } else this.turnShowTypeOn();

    if (this.STORAGE.isValidItem(this.colorsName)) {
      this.showColors = this.STORAGE.getItem(this.colorsName) === 'true';
    } else this.turnShowColorsOff();

    if (this.STORAGE.isValidItem(this.descriptionName)) {
      this.showDescription = this.STORAGE.getItem(this.descriptionName) === 'true';
    } else this.turnShowDescriptionOn();
  } // End constructor()

  getShowType(): boolean {
    return this.showType;
  }

  getShowColors(): boolean {
    return this.showColors;
  }

  getShowDescription(): boolean {
    return this.showDescription;
  }

  private setShowType(_showType: boolean): void {
    this.STORAGE.setItem(this.typeName, _showType.toString());
    this.showType = _showType;
  }

  private setShowColors(_showColors: boolean): void {
    this.STORAGE.setItem(this.colorsName, _showColors.toString());
    this.showColors = _showColors;
  }

  private setShowDescription(_showDescription: boolean): void {
    this.STORAGE.setItem(this.descriptionName, _showDescription.toString());
    this.showDescription = _showDescription;
  }

  turnShowTypeOn(): void {
    this.setShowType(true);
  }

  turnShowColorsOn(): void {
    this.setShowColors(true);
  }

  turnShowDescriptionOn(): void {
    this.setShowDescription(true);
  }

  turnShowTypeOff(): void {
    this.setShowType(false);
  }

  turnShowColorsOff(): void {
    this.setShowColors(false)
  }

  turnShowDescriptionOff(): void {
    this.setShowDescription(false);
  }

  toggleShowType(): void {
    this.setShowType(!this.showType);
  }

  toggleShowColors(): void {
    this.setShowColors(!this.showColors);
  }

  toggleShowDescription(): void {
    this.setShowDescription(!this.showDescription);
  }
}
