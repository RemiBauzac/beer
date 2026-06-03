

import SpineItem from './spine-item';
import domToJson from '../lib/dom-to-json';
import EpubCfi from '../lib/epubcfi';

const epubCfi = new EpubCfi();

export default class Opf {
  static create(basePath, xmlDoc) {
    const opf = new Opf();

    opf.metadata = domToJson(xmlDoc.querySelector('metadata'));
    if (!(opf.metadata.meta instanceof Array)) {
      opf.metadata.meta = [opf.metadata.meta];
    }

    const spineNodeIndex = epubCfi.indexOfElement(xmlDoc.querySelector('spine'));

    const spineItemsRefs = [].concat(domToJson(xmlDoc.querySelector('spine')).itemref || []).map(item => item._idref);
    opf.spineItems = [].concat(domToJson(xmlDoc.querySelector('manifest')).item || [])
      .filter(item => spineItemsRefs.includes(item._id))
      .map(spineItemXml => {
        const spineItem = SpineItem.fromXml(spineItemXml);
        spineItem.cfi = epubCfi.generateChapterComponent(spineNodeIndex, spineItemsRefs.indexOf(spineItem.id), spineItem.id);
        return spineItem;
      });

    opf.spineItems.forEach(spineItem => { spineItem.href = `${basePath}${spineItem.href}`; return true; });

    return opf;
  }
}
