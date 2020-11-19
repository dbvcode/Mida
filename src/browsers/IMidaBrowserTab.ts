import { IMidaBrowser } from "#browsers/IMidaBrowser";
import { MidaHttpResponse } from "#utilities/http/MidaHttpResponse";

// Represents a browser tab (used to load and manipulate webpages).
export interface IMidaBrowserTab {
    // Represents the browser that created the window.
    readonly browser: IMidaBrowser;

    // Used to set the user agent of the tab.
    setUserAgent (userAgent: string): Promise<void>;

    // Used to request and load a webpage.
    goto (uri: string): Promise<MidaHttpResponse>;

    // Used to evaluate JavaScript code in the current document.
    evaluate (text: string): Promise<any>;

    // Used to expose a function to the current document.
    exposeProcedure (name: string, procedure: (...parameters: any[]) => any): Promise<void>;

    // Used to add a listener notified when a web request occurs.
    addRequestListener (listener: (...parameters: any[]) => any): Promise<void>;

    // Used to focus an element in the current document.
    focus (selector: string): Promise<boolean>;

    // Used to type in a input element in the current document.
    type (selector: string, text: string): Promise<boolean>;

    // Used to click an element in the current document.
    click (selector: string, count?: number): Promise<boolean>;

    // Used to wait until a given selector is matched.
    waitForSelector (selector: string): Promise<void>;

    // Used to close the tab.
    close (): Promise<void>;
}
