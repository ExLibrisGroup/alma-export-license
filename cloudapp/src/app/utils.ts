import { Pipe, PipeTransform } from "@angular/core";

  /** Execute XPath */
  const select = (doc: Document, expression: string, options: {context?: Node, single?: boolean}={context: null, single: false}) => {
    const evaluator = new XPathEvaluator();
    const resolver = resolverFactory(doc.documentElement);
    return evaluator.evaluate(expression, options.context || doc, resolver, options.single ? XPathResult.FIRST_ORDERED_NODE_TYPE : XPathResult.ANY_TYPE, null);
  }

  const selectSingleNode = (doc: Document, expression: string) => {
    return select(doc, expression, { single: true }).singleNodeValue;
  }

  const selectText= (doc: Document, expression: string) => {
    const node = selectSingleNode(doc, expression);
    return node && node.textContent;
  }

  const resolverFactory = (element: Element): XPathNSResolver => {
    const resolver = element.ownerDocument.createNSResolver(element);
    const defaultNamespace = element.getAttribute('xmlns');
    // @ts-ignore 
    return (prefix: string) => resolver.lookupNamespaceURI(prefix) || defaultNamespace;
  }

  /** Converts XPathResult to Array */
  const xpathToArray = (nodes: XPathResult) => {
    let result: Array<String> = [];
    let node = nodes.iterateNext();
    while (node) {
      result.push(node.textContent);
      node = nodes.iterateNext();
    }
    return result;
  };

  /** Adds Element to dom and returns it */
  const dom = (name: string, options: {parent?: Element | Node, text?: string, className?: string, 
    id?: string, ns?: string, attributes?: string[][]} = {}): Element => {
    let ns = options.ns || ((options.parent && options.parent instanceof Element) ? options.parent.namespaceURI : '');
    let element = document.createElementNS(ns, name);
    
    if (options.parent) options.parent.appendChild(element);
    if (options.text) element.innerHTML = options.text;
    if (options.className) element.className = options.className;
    if (options.id) element.id = options.id;
    if (options.attributes) options.attributes.forEach(([att, val]) => element.setAttribute(att, val));

    return element;  
  };

  /**
   * String to Array Buffer
   * @param s 
   * @returns ArrayBuffer
   */
  const s2ab = (s) => { 
    var buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
    var view = new Uint8Array(buf);  //create uint8array as viewer
    for (var i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF; //convert to octet
    return buf;    
  }

  /**
   * Creates File object from data
   * @param {string} contents Base64 encoded content
   * @param {string} name File name
   * @param {string} mime Mime tuype
   * @returns File
   */
  const dataToFile = (contents: string, name: string, mime: string): File => {
    let bstr = atob(contents), 
      n = bstr.length, 
      u8arr = new Uint8Array(n);
          
      while(n--){
        u8arr[n] = bstr.charCodeAt(n);
      }
      
      return new File([u8arr], name, { type: mime});
  }

  const mapi18n = (val: string) => {
    return val.substr(val.lastIndexOf('.') + 1);
  }

  @Pipe({name: 'mapi18n'})
  export class Mapi18nPipe implements PipeTransform {
    transform(value: string): string {
      return mapi18n(value);
    }
  }

export { select, selectSingleNode, dom, s2ab, dataToFile, selectText, mapi18n }

