
  /** Execute XPath */
  const select = (doc: Document, expression: string, options: {context?: Node, single?: boolean}={context: null, single: false}) => {
    const evaluator = new XPathEvaluator();
    const resolver = resolverFactory(doc.documentElement);
    return evaluator.evaluate(expression, options.context || doc, resolver, options.single ? XPathResult.FIRST_ORDERED_NODE_TYPE : XPathResult.ANY_TYPE, null);
  }

  const selectSingleNode = (doc: Document, expression: string) => {
    const node = select(doc, expression, { single: true }).singleNodeValue;
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
    id?: string, attributes?: string[][]} = {}): Element => {

    let ns = options.parent ? options.parent.namespaceURI : '';
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

export { select, selectSingleNode, s2ab, dataToFile }

