import inquirer from 'inquirer';

export default async (interactive, message, defaultValue = true) => {
  if (interactive) {
    return (await inquirer.createPromptModule()({
      type: 'confirm',
      name: 'confirm',
      message,
    })).confirm;
  }
  return defaultValue;
};
