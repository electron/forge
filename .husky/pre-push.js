const inquirer = require('inquirer');

const question = [
  {
    type: 'confirm',
    name: 'continuePush',
    message: '[pre-push hook] Warning: this is a protected branch. Continue?',
  },
];

inquirer.prompt(question).then((answer) => {
  if (answer.continuePush == false) process.exit(1);
  process.exit(0);
});
