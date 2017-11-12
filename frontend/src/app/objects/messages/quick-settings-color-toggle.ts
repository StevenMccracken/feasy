export class QuickSettingsColorToggle {
  private doDisplayColors: boolean;

  constructor(private _doDisplayColors: boolean) {
    this.doDisplayColors = _doDisplayColors;
  }

  /**
   * Determines whether or not the Show Colors
   * quick settings was toggled on or off
   * @return {boolean} whether or not to show colors
   */
  shouldDisplayColors(): boolean {
    return this.doDisplayColors;
  }
}
