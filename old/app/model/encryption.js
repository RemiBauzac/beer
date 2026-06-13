import domToJson from '../lib/dom-to-json';

export default class Encryption {
  static async create(xmlDoc, opf) {
    const encryption = new Encryption();

    const metaId = Array.isArray(opf.metadata.identifier)
      ? opf.metadata.identifier[0].__text
      : opf.metadata.identifier.__text;

    // IDPF obfuscation spec (http://www.idpf.org/2008/embedding) requires SHA-1
    const hashBuffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(metaId));
    const idpfKey = new Uint8Array(hashBuffer);
    const adobeKey = urnUuidToByteArray(metaId);

    const encryptedData = domToJson(xmlDoc.querySelector('encryption'));
    encryption.encryptedItems = [];

    [].concat(encryptedData.EncryptedData || []).forEach(element => {
      const item = element.CipherData.CipherReference._URI;
      const algorithm = element.EncryptionMethod._Algorithm;
      encryption.encryptedItems[item] = { algorithm, key: { idpf: idpfKey, adobe: adobeKey } };
    });

    return encryption;
  }

  static empty() {
    return {
      encryptedItems: []
    };
  }
}

function urnUuidToByteArray(id) {
  const uuidRegexp = /(urn:uuid:)?([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})/i;
  const matchResults = uuidRegexp.exec(id);
  const rawUuid = matchResults[2] + matchResults[3] + matchResults[4] + matchResults[5] + matchResults[6];
  if (rawUuid?.length !== 32) {
    return null;
  }
  const array = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    const byteHex = rawUuid.substr(i * 2, 2);
    array[i] = parseInt(byteHex, 16);
  }
  return array;
}
