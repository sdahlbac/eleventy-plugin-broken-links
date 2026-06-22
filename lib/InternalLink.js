class InternalLink {
  constructor(targetPath) {
    this.targetPath = targetPath;
    this.pages = new Set();
    this.linkCount = 0;
    this.exists = null;
  }

  incrementLinkCount() {
    this.linkCount++;
    return this.linkCount;
  }

  getLinkCount() {
    return this.linkCount;
  }

  addPage(page) {
    this.pages.add(page);
  }

  getPages() {
    return Array.from(this.pages);
  }

  setExists(exists) {
    this.exists = exists;
  }

  getExists() {
    return this.exists;
  }
}

module.exports = InternalLink;
