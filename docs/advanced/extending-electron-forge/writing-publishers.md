# Writing Publishers

An Electron Forge Publisher has to export a single class that extends the base publisher. The base plugin can be depended on by installing`@electron-forge/publisher-base`.

Check out the interface of [`PublisherBase`](https://js.electronforge.io/modules/_electron_forge_publisher_base.html) for more advanced API details.

The publisher **must** implement one method:

### `publish(options: PublisherOptions): Promise<void>`

Publishers must implement this method to publish the artifacts returned from make calls. If any errors occur you must throw them, failing silently or simply logging will not propagate issues up to Forge.

Please note for a given version, publish will be called multiple times, once for each set of "platform" and "arch". This means if you are publishing `darwin` and `win32` artifacts to somewhere like GitHub on the first publish call, you will have to create the version on GitHub and the second call will just be appending files to the existing version.  Your `publish` implementation will not be aware that another call is coming, however it must just be able to handle this case.

The `config` for the publisher will be available on `this.config`.

The options object is documented in [`PublisherOptions`](https://js.electronforge.io/interfaces/_electron_forge_publisher_base.PublisherOptions.html).

```javascript
export default class MyPublisher extends PublisherBase {
  async publish (opts) {
    for (const result of opts.makeResults) {
      await createVersionIfNotExists();
      await uploadDistributable(result);
    }
  }
}
```
