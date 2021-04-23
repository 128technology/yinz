import * as libXML from 'libxmljs2';

function toElement(xmlText: string) {
  return libXML.parseXmlString(xmlText).root()!;
}

export const t128InternalNS = 'xmlns:t128-internal="http://128technology.com/t128-internal-extensions"';
export const yinNS = 'xmlns:yin="urn:ietf:params:xml:ns:yang:yin:1"';

export default { toElement };
