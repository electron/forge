// Mimics how @vercel/webpack-asset-relocator-loader sets __webpack_require__.ab.
const hooked = new WeakSet();
module.exports = function (content) {
  const { mainTemplate } = this._compilation;
  if (!hooked.has(mainTemplate)) {
    hooked.add(mainTemplate);
    mainTemplate.hooks.requireExtensions.tap(
      'asset-relocator-loader',
      (source) =>
        `${source}\nif (typeof __webpack_require__ !== 'undefined') __webpack_require__.ab = __dirname + "/native_modules/";`,
    );
  }
  return content.replace('ASSET_BASE', '__webpack_require__.ab');
};
