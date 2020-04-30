'use strict';
const {execFile} = require('child_process');
const {unlink} = require('fs');

const jpegtran = (m => m.__esModule ? /* istanbul ignore next */ m.default : /* istanbul ignore next */ m)(require('jpegtran-bin'));
const sharp = (m => m.__esModule ? /* istanbul ignore next */ m.default : /* istanbul ignore next */ m)(require('sharp'));

const headers = (m => m.__esModule ? /* istanbul ignore next */ m.default : /* istanbul ignore next */ m)(require('./headers.js'));
const previewIfy = (m => m.__esModule ? /* istanbul ignore next */ m.default : /* istanbul ignore next */ m)(require('./preview.js'));

const fit = sharp.fit.inside;
const jpegtranArgs = ['-progressive', '-optimize', '-outfile'];
const withoutEnlargement = true;

const optimize = (source, dest, options) => new Promise((res, rej) => {
  execFile(jpegtran, jpegtranArgs.concat(dest, source), err => {
    if (err)
      rej(err);
    else if (options.createFiles)
      headers(source, dest, options.headers)
        .then(() => res(dest), rej);
    else
      res(dest);
  });
});

/**
 * Create a file after optimizing via `jpegtran`.
 * @param {string} source The source JPG/JPEG file to optimize.
 * @param {string} dest The optimized destination file.
 * @param {Options} [options] Options to deal with extra computation.
 * @return {Promise<string>} A promise that resolves with the destination file.
 */
module.exports = (source, dest, /* istanbul ignore next */ options = {}) =>
  new Promise((res, rej) => {
    const {maxWidth: width, maxHeight: height, preview} = options;
    const done = () => res(dest);
    if (width || height) {
      sharp(source)
        .resize({width, height, fit, withoutEnlargement})
        .toFile(`${dest}.resized.jpg`)
        .then(
          () => optimize(`${dest}.resized.jpg`, dest, options).then(
            () => {
              unlink(`${dest}.resized.jpg`, err => {
                /* istanbul ignore next */
                if (err)
                  rej(err);
                else if (preview)
                  previewIfy(dest).then(done, rej);
                else
                  done();
              });
            },
            rej
          ),
          rej
        )
      ;
    }
    else
      optimize(source, dest, options).then(
        /* istanbul ignore next */
        preview ? () => previewIfy(dest).then(done, rej) : done,
        rej
      );
  });