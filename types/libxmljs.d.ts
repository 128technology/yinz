// Type definitions for Libxmljs v0.14.2
// Project: https://github.com/polotek/libxmljs
// Definitions by: François de Campredon <https://github.com/fdecampredon>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

declare module 'libxmljs' {
  import events = require('events');

  export function parseXml(source: string): XMLDocument;
  export function parseHtml(source: string): HTMLDocument;
  export function parseXmlString(source: string): XMLDocument;
  export function parseHtmlString(source: string): HTMLDocument;

  export class XMLDocument {
    public validationErrors: XmlError[];

    constructor(version: number, encoding: string);
    public child(idx: number): Element | undefined;
    public childNodes(): Element[];
    public errors(): SyntaxError[];
    public encoding(): string;
    public encoding(enc: string): void;
    public find(xpath: string): Element[];
    public get(xpath: string): Element | undefined;
    public node(name: string, content: string): Element;
    public root(): Element;
    public toString(): string;
    public validate(xsdDoc: XMLDocument): boolean;
    public version(): number;
  }

  export class HTMLDocument extends XMLDocument {}

  export class Element {
    constructor(doc: XMLDocument, name: string, content?: string);
    public name(): string;
    public name(newName: string): void;
    public node(name: string, content?: string): Element;
    public text(): string;
    public attr(name: string): Attribute;
    public attr(attr: Attribute | { [key: string]: string }): void;
    public attrs(): Attribute[];
    public parent(): Element;
    public doc(): XMLDocument;
    public child(idx: number): Element | undefined;
    public childNodes(): Element[];
    public clone(): Element;
    public addChild(child: Element): Element;
    public nextSibling(): Element;
    public nextElement(): Element;
    public addNextSibling(siblingNode: Element): Element;
    public prevSibling(): Element;
    public prevElement(): Element;
    public addPrevSibling(siblingNode: Element): Element;
    public find(xpath: string): Element[];
    public find(xpath: string, ns_uri: string): Element[];
    public find(xpath: string, namespaces: { [key: string]: string }): Element[];
    public get(xpath: string): Element | undefined;
    public get(xpath: string, ns_uri: string): Element | undefined;
    public get(xpath: string, ns_uri: { [key: string]: string }): Element | undefined;
    public defineNamespace(href: string): Namespace;
    public defineNamespace(prefix: string, href: string): Namespace;
    public namespace(): Namespace;
    public namespace(ns: Namespace): Element;
    public namespace(href: string): Namespace;
    public namespace(prefix: string, href: string): Namespace;
    public namespaces(): Namespace[];
    public remove(): void;
    public path(): string;
    public type(): string;
  }

  export class Attribute {
    constructor(node: Element, name: string, value: string, ns?: Namespace);
    public name(): string;
    public namespace(ns?: Namespace): Namespace;
    public nextSibling(): Attribute;
    public node(): Element;
    public prevSibling(): Attribute;
    public remove(): void;
    public value(): string;
  }

  export class Namespace {
    constructor(node: Element, prefix: string, href: string);
    public href(): string;
    public prefix(): string;
  }

  export class SaxParser extends events.EventEmitter {
    parseString(source: string): boolean;
  }

  export class SaxPushParser extends events.EventEmitter {
    push(source: string): boolean;
  }

  export interface XmlError {
    domain: number;
    code: number;
    message: string;
    level: number;
    file?: string;
    column: number;
    line: number;
  }
}
