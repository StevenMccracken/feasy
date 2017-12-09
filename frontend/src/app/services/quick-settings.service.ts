// Import angular packages
import { Injectable } from '@angular/core';

// Import our files
import { LocalStorageService } from '../utils/local-storage.service';

@Injectable()
export class QuickSettingsService {
  private quickSettingsPrefix: string = 'quickSettings';
  private typeName: string;
  private colorsName: string;
  private descriptionName: string;
  private defaultCalendarViewName: string;

  private showType: boolean;
  private showColors: boolean;
  private showDescription: boolean;
  private defaultCalendarViewIsWeek: boolean;

  constructor(private STORAGE: LocalStorageService) {
    this.typeName = `${this.quickSettingsPrefix}_type`;
    this.colorsName = `${this.quickSettingsPrefix}_color`;
    this.descriptionName = `${this.quickSettingsPrefix}_description`;
    this.defaultCalendarViewName = `${this.quickSettingsPrefix}_calendarView`;

    /*
     * Check if quick settings are already in local storage. Default is true
     * for showing the type and description. Default for colors is false
     */
    if (this.STORAGE.isValidItem(this.typeName)) {
      this.showType = this.STORAGE.getItem(this.typeName) === 'true';
    } else this.turnShowTypeOn();

    if (this.STORAGE.isValidItem(this.colorsName)) {
      this.showColors = this.STORAGE.getItem(this.colorsName) === 'true';
    } else this.turnShowColorsOn();

    if (this.STORAGE.isValidItem(this.descriptionName)) {
      this.showDescription = this.STORAGE.getItem(this.descriptionName) === 'true';
    } else this.turnShowDescriptionOn();

    if (this.STORAGE.isValidItem(this.defaultCalendarViewName)) {
      this.defaultCalendarViewIsWeek = this.STORAGE.getItem(this.defaultCalendarViewName) === 'true';
    } else this.turnDefaultCalendarViewAsWeekOff();
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

  getDefaultCalendarViewIsWeek(): boolean {
    return this.defaultCalendarViewIsWeek;
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

  private setDefaultCalendarViewIsWeek(_defaultCalendarViewIsWeek: boolean): void {
    this.STORAGE.setItem(this.defaultCalendarViewName, _defaultCalendarViewIsWeek.toString());
    this.defaultCalendarViewIsWeek = _defaultCalendarViewIsWeek;
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

  turnDefaultCalendarViewAsWeekOn(): void {
    this.setDefaultCalendarViewIsWeek(true);
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

  turnDefaultCalendarViewAsWeekOff(): void {
    this.setDefaultCalendarViewIsWeek(false);
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

  toggleDefaultCalendarViewAsWeek(): void {
    this.setDefaultCalendarViewIsWeek(!this.defaultCalendarViewIsWeek);
  }
}
