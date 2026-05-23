declare module 'lightweight-charts' {
  export interface IChartApi {
    addCandlestickSeries(options?: any): ISeriesApi<'Candlestick'>;
    addHistogramSeries(options?: any): ISeriesApi<'Histogram'>;
    addLineSeries(options?: any): ISeriesApi<'Line'>;
    addAreaSeries(options?: any): ISeriesApi<'Area'>;
    addBarSeries(options?: any): ISeriesApi<'Bar'>;
    applyOptions(options: any): void;
    resize(width: number, height: number): void;
    remove(): void;
    timeScale(): ITimeScaleApi;
    priceScale(mode?: any): IPriceScaleApi;
  }

  export interface ISeriesApi<T extends string = any> {
    setData(data: any[]): void;
    update(data: any): void;
    applyOptions(options: any): void;
    priceFormatter(): IPriceFormatter;
  }

  export interface ITimeScaleApi {
    fitContent(): void;
    applyOptions(options: any): void;
  }

  export interface IPriceScaleApi {
    applyOptions(options: any): void;
  }

  export interface IPriceFormatter {
    format(price: number): string;
  }

  export function createChart(container: HTMLElement | string, options?: any): IChartApi;

  export const CrosshairMode: {
    Normal: number;
    Magnet: number;
  };

  export const PriceScaleMode: {
    Normal: number;
    Logarithmic: number;
    Percentage: number;
    IndexedTo100: number;
  };

  export const ColorType: Record<string, string>;

  export interface CandlestickData {
    time: number | string;
    open: number;
    high: number;
    low: number;
    close: number;
  }

  export interface HistogramData {
    time: number | string;
    value: number;
    color?: string;
  }

  export interface LineData {
    time: number | string;
    value: number;
  }

  export interface AreaData {
    time: number | string;
    value: number;
  }

  export interface BarData {
    time: number | string;
    open: number;
    high: number;
    low: number;
    close: number;
  }
}
