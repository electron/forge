## publisher-nucleus

`@electron-forge/publisher-nucleus` publishes all your artifacts to an instance of Nucleus Update Server where users will be able to download them. This update service supports all three platforms.

Check out the README at [`atlassian/nucleus`](https://github.com/atlassian/nucleus) for more information on this project.

Configuration options are documented in [`Publisher
NucleusConfig](https://js.electronforge.io/interfaces/_electron_forge_publisher_nucleus.PublisherNucleusConfig.html).


```javascript title=forge.config.js
module.exports = {
  // ...
  publishers: [
    {
      name: '@electron-forge/publisher-nucleus',
      config: {
        host: 'https://my-nucleus.mysite.com',
        appId: 1,
        channelId: 'abcdefg',
        token: 'my-token'
      }
    }
  ]
}
```

We recommend you set the `token`option using an environment variable, don't hard code into in your config.