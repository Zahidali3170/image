import {
  ColorPickerPanel,
  IPoint,
  MarkerBaseState,
  RectangularBoxMarkerBase,
  LineWidthPanel,
  Settings,
  SvgHelper,
  ToolboxPanel,
  FreehandMarkerState,
} from "markerjs2";

import createSvgToBase64 from "../utils/createSvgToBase64";

const PinMarkerSVG = `<?xml version="1.0" ?><svg height="24" version="1.1" width="24" xmlns="http://www.w3.org/2000/svg" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><g transform="translate(0 -1028.4)"><path d="m12 0c-4.4183 2.3685e-15 -8 3.5817-8 8 0 1.421 0.3816 2.75 1.0312 3.906 0.1079 0.192 0.221 0.381 0.3438 0.563l6.625 11.531 6.625-11.531c0.102-0.151 0.19-0.311 0.281-0.469l0.063-0.094c0.649-1.156 1.031-2.485 1.031-3.906 0-4.4183-3.582-8-8-8zm0 4c2.209 0 4 1.7909 4 4 0 2.209-1.791 4-4 4-2.2091 0-4-1.791-4-4 0-2.2091 1.7909-4 4-4z" fill="#e74c3c" transform="translate(0 1028.4)"/><path d="m12 3c-2.7614 0-5 2.2386-5 5 0 2.761 2.2386 5 5 5 2.761 0 5-2.239 5-5 0-2.7614-2.239-5-5-5zm0 2c1.657 0 3 1.3431 3 3s-1.343 3-3 3-3-1.3431-3-3 1.343-3 3-3z" fill="#c0392b" transform="translate(0 1028.4)"/></g></svg>`;

export class LocationPinMarker extends RectangularBoxMarkerBase {
  /**
   * String type name of the marker type.
   *
   * Used when adding {@link MarkerArea.availableMarkerTypes} via a string and to save and restore state.
   */
  public static typeName = "LocationPinMarker";

  /**
   * Marker type title (display name) used for accessibility and other attributes.
   */
  public static title = "PLACE PIN";
  /**
   * SVG icon markup displayed on toolbar buttons.
   */
  public static icon = PinMarkerSVG;

  /**
   * Marker color.
   */
  protected color = "transparent";
  /**
   * Marker's stroke width.
   */
  protected lineWidth = 3;

  private colorPanel: ColorPickerPanel;
  private lineWidthPanel: LineWidthPanel;

  private drawingImage!: SVGImageElement;
  private drawingImgUrl = "";

  private drawing = false;

  private pixelRatio = 1;

  /**
   * Creates a new marker.
   *
   * @param container - SVG container to hold marker's visual.
   * @param overlayContainer - overlay HTML container to hold additional overlay elements while editing.
   * @param settings - settings object containing default markers settings.
   */
  constructor(
    container: SVGGElement,
    overlayContainer: HTMLDivElement,
    settings: Settings
  ) {
    super(container, overlayContainer, settings);

    this.drawingImgUrl = createSvgToBase64(PinMarkerSVG);

    this.color = settings.defaultColor;
    this.lineWidth = settings.defaultStrokeWidth;
    this.pixelRatio = settings.freehandPixelRatio;

    this.setColor = this.setColor.bind(this);
    this.setLineWidth = this.setLineWidth.bind(this);

    this.colorPanel = new ColorPickerPanel(
      "Color",
      settings.defaultColorSet,
      settings.defaultColor
    );
    this.colorPanel.onColorChanged = this.setColor;

    this.lineWidthPanel = new LineWidthPanel(
      "Line width",
      settings.defaultStrokeWidths,
      settings.defaultStrokeWidth
    );
    this.lineWidthPanel.onWidthChanged = this.setLineWidth;
  }

  /**
   * Returns true if passed SVG element belongs to the marker. False otherwise.
   *
   * @param el - target element.
   */
  public ownsTarget(el: EventTarget): boolean {
    if (
      super.ownsTarget(el) ||
      el === this.visual ||
      el === this.drawingImage
    ) {
      return true;
    } else {
      return false;
    }
  }

  protected createVisual(): void {
    this.visual = SvgHelper.createGroup();
    this.drawingImage = SvgHelper.createImage();

    SvgHelper.setAttributes(this.drawingImage, [["href", this.drawingImgUrl]]);

    this.visual.appendChild(this.drawingImage);

    const translate = SvgHelper.createTransform();
    this.visual.transform.baseVal.appendItem(translate);

    this.setDrawingImage();

    this.addMarkerVisualToContainer(this.visual);
  }

  private getPoints(): string {
    return `0,${this.height} ${this.width / 2},0 ${this.width},${this.height}`;
  }

  protected setPoints(): void {
    super.setSize();
    // alert(`trigger ${this.getPoints()}`);
    SvgHelper.setAttributes(this.visual, [["points", this.getPoints()]]);
  }

  /**
   * Handles pointer (mouse, touch, stylus, etc.) down event.
   *
   * @param point - event coordinates.
   * @param target - direct event target element.
   */
  public pointerDown(point: IPoint, target?: EventTarget): void {
    super.pointerDown(point, target);

    if (this.state === "new") {
      this.createVisual();

      this.moveVisual(point);

      this._state = "creating";

      this.drawing = true;
    }
  }

  /**
   * Resize marker based on current pointer coordinates and context.
   * @param point
   */
  protected resize(point: IPoint): void {
    super.resize(point);

    SvgHelper.setAttributes(this.drawingImage, [
      ["height", this.height.toString()],
      ["width", this.width.toString()],
    ]);

    this.setPoints();
  }

  /**
   * Handles pointer (mouse, touch, stylus, etc.) up event.
   *
   * @param point - event coordinates.
   */
  public pointerUp(point: IPoint): void {
    super.pointerUp(point);

    if (this._state === "creating") {
      if (this.drawing) {
        this.drawing = false;

        this.setPoints();
      }
    }
  }

  public getDefaultSize() {
    if (this.state !== "creating") {
      return "30px";
    }

    return "";
  }

  /**
   * set marker attributes
   */
  private setDrawingImage() {
    const _width = this.width ? `${this.width}px` : this.getDefaultSize();
    const _height = this.width ? `${this.width}px` : this.getDefaultSize();

    SvgHelper.setAttributes(this.drawingImage, [
      ["width", _width],
      ["height", _height],
    ]);

    this.moveVisual({ x: this.left, y: this.top });
  }

  /**
   * Sets marker drawing color.
   * @param color - new color.
   */
  protected setColor(color: string): void {
    this.color = color;
    this.colorChanged(color);
  }

  /**
   * Sets line width.
   * @param width - new line width
   */
  protected setLineWidth(width: number): void {
    this.lineWidth = width;
  }

  /**
   * Returns the list of toolbox panels for this marker type.
   */
  public get toolboxPanels(): ToolboxPanel[] {
    if (this.state === "new" || this.state === "creating") {
      return [this.colorPanel, this.lineWidthPanel];
    } else {
      return [];
    }
  }

  /**
   * Returns current marker state that can be restored in the future.
   */
  public getState(): FreehandMarkerState {
    const result: FreehandMarkerState = Object.assign(
      {
        drawingImgUrl: this.drawingImgUrl,
      },
      super.getState()
    );
    result.typeName = LocationPinMarker.typeName;

    return result;
  }

  /**
   * Restores previously saved marker state.
   *
   * @param state - previously saved state.
   */
  public restoreState(state: MarkerBaseState): void {
    this.createVisual();
    super.restoreState(state);

    this.setDrawingImage();
  }

  /**
   * Scales marker. Used after the image resize.
   *
   * @param scaleX - horizontal scale
   * @param scaleY - vertical scale
   */
  public scale(scaleX: number, scaleY: number): void {
    super.scale(scaleX, scaleY);

    this.setDrawingImage();
  }
}
